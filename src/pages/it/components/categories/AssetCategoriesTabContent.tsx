import React, { useState, useMemo, memo } from "react";
import type { ITAsset } from "../../types";
import { STANDARD_ASSET_CATEGORIES, type AssetCategoryCardConfig } from "../../constants";

interface AssetCategoriesTabContentProps {
  assets: ITAsset[];
  canManage: boolean;
  onSelectCategory: (categoryName: string) => void;
  onOpenAssetModalForCategory: (categoryName: string) => void;
}

export const AssetCategoriesTabContent: React.FC<AssetCategoriesTabContentProps> = memo(
  function AssetCategoriesTabContent({
    assets,
    canManage,
    onSelectCategory,
    onOpenAssetModalForCategory,
  }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Compute metrics for each standard category with strict, collision-free matching
    const categoryCardsWithMetrics = useMemo(() => {
      return STANDARD_ASSET_CATEGORIES.map((cfg) => {
        // Find matching assets specifically for this category
        const matchedAssets = assets.filter((a) => {
          const rawCat = (a.category || "").trim().toLowerCase();
          const targetName = cfg.name.trim().toLowerCase();

          // 1. Direct exact category name match
          if (rawCat && rawCat === targetName) return true;

          // 2. Strict prefix match (e.g., "Contact:" matches only "Contact: Phone, Sim Card Number")
          const targetPrefix = targetName.split(":")[0]?.trim();
          if (rawCat && targetPrefix && rawCat.startsWith(targetPrefix)) {
            return true;
          }

          // 3. Fallback for legacy assets where category is null but type was stored
          if (!a.category && a.type) {
            const t = a.type.toLowerCase();
            if (cfg.id === "contact_phone_sim" && (t === "mobile" || t === "phone")) return true;
            if (cfg.id === "laptop_bundle" && t === "laptop") return true;
            if (cfg.id === "desktop_bundle" && t === "desktop") return true;
            if (cfg.id === "displays" && t === "display") return true;
            if (cfg.id === "peripherals" && t === "peripheral") return true;
            if (cfg.id === "furniture" && t === "furniture") return true;
            if (cfg.id === "server_network" && (t === "server" || t === "network")) return true;
          }

          return false;
        });

        const total = matchedAssets.length;
        let assigned = 0;
        let issue = 0;
        let available = 0;

        matchedAssets.forEach((a) => {
          if (a.status === "active" || !!a.employee_id) {
            assigned++;
          } else if (a.status === "maintenance" || (a.status as string) === "damaged") {
            issue++;
          } else {
            available++;
          }
        });

        return {
          ...cfg,
          metrics: {
            total,
            assigned,
            issue,
            available,
          },
        };
      });
    }, [assets]);

    // Filter cards by search query
    const filteredCards = useMemo(() => {
      if (!searchQuery.trim()) return categoryCardsWithMetrics;
      const q = searchQuery.toLowerCase().trim();
      return categoryCardsWithMetrics.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subType.toLowerCase().includes(q) ||
          c.trackingBadges.some((b) => b.toLowerCase().includes(q))
      );
    }, [categoryCardsWithMetrics, searchQuery]);

    return (
      <div className="space-y-5" onClick={() => activeMenuId && setActiveMenuId(null)}>
        {/* Top Header & Search Bar matching ERP layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">
              Asset Category
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage corporate hardware inventory grouped by functional equipment categories.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canManage && (
              <button
                type="button"
                onClick={() => onOpenAssetModalForCategory("")}
                className="px-4 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <i className="ri-add-line text-sm" />
                <span>+ Register Asset</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar matching screenshot */}
        <div className="max-w-md flex rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-[#253C7D]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            className="px-3.5 bg-[#253C7D] hover:bg-[#1E3066] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Grid of Asset Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#253C7D]/40 transition-all flex flex-col justify-between p-4 group"
            >
              <div>
                {/* Card Header: Title & 3-dot menu */}
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => onSelectCategory(card.name)}
                    className="text-xs font-black text-slate-800 leading-snug cursor-pointer hover:text-[#253C7D] transition-colors"
                  >
                    {card.name}
                  </h3>

                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === card.id ? null : card.id);
                      }}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <i className="ri-more-2-fill text-sm" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === card.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-7 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onSelectCategory(card.name);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <i className="ri-eye-line text-slate-400" />
                          <span>View Assets ({card.metrics.total})</span>
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onOpenAssetModalForCategory(card.name);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#253C7D] hover:bg-blue-50/50 flex items-center gap-2 cursor-pointer"
                          >
                            <i className="ri-add-circle-line" />
                            <span>+ Add Asset to Category</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-type label in blue */}
                <p className="text-[11px] font-bold text-blue-600 mt-1.5">
                  {card.subType}
                </p>

                {/* Tracking Badges */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {card.trackingBadges.map((badge) => (
                    <span
                      key={badge}
                      className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50/70 text-[10px] font-medium text-slate-600 shadow-2xs whitespace-nowrap"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* 4-column Metrics Footer */}
              <div className="border-t border-slate-100 pt-3 mt-4 grid grid-cols-4 text-center divide-x divide-slate-100">
                <div className="px-1">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {card.metrics.total}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Total</p>
                </div>

                <div className="px-1">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {card.metrics.assigned}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Assigned</p>
                </div>

                <div className="px-1">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {card.metrics.issue}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Issue</p>
                </div>

                <div className="px-1">
                  <p className="text-sm font-black text-emerald-600 leading-none">
                    {card.metrics.available}
                  </p>
                  <p className="text-[10px] text-emerald-600/90 font-bold mt-1">Available</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
