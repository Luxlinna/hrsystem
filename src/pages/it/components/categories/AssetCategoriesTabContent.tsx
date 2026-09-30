import React, { useState, useMemo, memo } from "react";
import type { ITAsset, ITTabType } from "../../types";
import { STANDARD_ASSET_CATEGORIES, type AssetCategoryCardConfig } from "../../constants";
import { CreateAssetCategoryModal, type AssetCategoryFormData } from "./CreateAssetCategoryModal";
import { AssetSettingView } from "./AssetSettingView";
import { AssetNavDropdown } from "../navigation/AssetNavDropdown";

interface AssetCategoriesTabContentProps {
  assets: ITAsset[];
  canManage: boolean;
  onSelectCategory: (categoryName: string) => void;
  onOpenAssetModalForCategory: (categoryName: string) => void;
  onSelectTab?: (tab: ITTabType) => void;
}

export const AssetCategoriesTabContent: React.FC<AssetCategoriesTabContentProps> = memo(
  function AssetCategoriesTabContent({
    assets,
    canManage,
    onSelectCategory,
    onOpenAssetModalForCategory,
    onSelectTab,
  }) {
    // Secondary sub-tabs matching Screenshot 1: "Asset Category" | "Asset Setting"
    const [subTab, setSubTab] = useState<"category" | "setting">("category");
    const [subTabDirection, setSubTabDirection] = useState<"next" | "prev">("next");

    const handleSelectSubTab = (newSubTab: "category" | "setting") => {
      setSubTabDirection(newSubTab === "setting" ? "next" : "prev");
      setSubTab(newSubTab);
    };

    // Dynamic Categories list
    const [categoriesList, setCategoriesList] = useState<AssetCategoryCardConfig[]>(() => {
      const saved = localStorage.getItem("hr_asset_categories_custom");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return STANDARD_ASSET_CATEGORIES;
        }
      }
      return STANDARD_ASSET_CATEGORIES;
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [featureFilter, setFeatureFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Modal state for Create / Edit Category
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AssetCategoryCardConfig | null>(null);

    // Save custom categories
    const saveCategories = (newList: AssetCategoryCardConfig[]) => {
      setCategoriesList(newList);
      try {
        localStorage.setItem("hr_asset_categories_custom", JSON.stringify(newList));
      } catch (e) {
        console.error("Failed to save categories:", e);
      }
    };

    const handleCreateOrUpdateCategory = (data: AssetCategoryFormData) => {
      const badges: string[] = [];
      if (data.trackSerialNumber) badges.push("Track Serial Number");
      if (data.trackWarranty) badges.push("Track Warranty");
      if (data.trackTagging) badges.push("Track Tagging");
      if (data.allowRequest) badges.push("Allow Request");
      if (data.manageQuantity) badges.push("Manage Quantity");

      if (editingCategory) {
        const updated = categoriesList.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: data.name,
                subType: data.type,
                tag: data.tag,
                manageQuantity: data.manageQuantity,
                allowRequest: data.allowRequest,
                trackSerialNumber: data.trackSerialNumber,
                trackWarranty: data.trackWarranty,
                trackTagging: data.trackTagging,
                serialNumber: data.serialNumber,
                sellerName: data.sellerName,
                invoiceRef: data.invoiceRef,
                serialNumbersList: data.serialNumbersList,
                imageUrl: data.imageUrl,
                attachments: data.attachments,
                trackingBadges: badges,
              }
            : c
        );
        saveCategories(updated);
        setEditingCategory(null);
      } else {
        const newCat: AssetCategoryCardConfig = {
          id: `cat_${Date.now()}`,
          name: data.name,
          subType: data.type,
          tag: data.tag,
          manageQuantity: data.manageQuantity,
          allowRequest: data.allowRequest,
          trackSerialNumber: data.trackSerialNumber,
          trackWarranty: data.trackWarranty,
          trackTagging: data.trackTagging,
          serialNumber: data.serialNumber,
          sellerName: data.sellerName,
          invoiceRef: data.invoiceRef,
          serialNumbersList: data.serialNumbersList,
          imageUrl: data.imageUrl,
          attachments: data.attachments,
          trackingBadges: badges,
          keywords: [data.name.toLowerCase(), data.type.toLowerCase(), (data.sellerName || "").toLowerCase()],
          status: "Active",
        };
        saveCategories([...categoriesList, newCat]);
      }
    };

    const handleDeleteCategory = (id: string) => {
      if (window.confirm("Are you sure you want to remove this asset category?")) {
        const updated = categoriesList.filter((c) => c.id !== id);
        saveCategories(updated);
      }
    };

    // Compute metrics for each category with collision-free matching
    const categoryCardsWithMetrics = useMemo(() => {
      return categoriesList.map((cfg) => {
        const matchedAssets = assets.filter((a) => {
          const rawCat = (a.category || "").trim().toLowerCase();
          const targetName = cfg.name.trim().toLowerCase();

          if (rawCat && rawCat === targetName) return true;

          const targetPrefix = targetName.split(":")[0]?.trim();
          if (rawCat && targetPrefix && rawCat.startsWith(targetPrefix)) {
            return true;
          }

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
    }, [categoriesList, assets]);

    // Filter cards by search query, features, and status
    const filteredCards = useMemo(() => {
      return categoryCardsWithMetrics.filter((c) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchType = c.subType.toLowerCase().includes(q);
          const matchTag = (c.tag || "").toLowerCase().includes(q);
          const matchBadges = c.trackingBadges?.some((b) => b.toLowerCase().includes(q));
          if (!matchName && !matchType && !matchTag && !matchBadges) return false;
        }

        // Features filter
        if (featureFilter !== "All") {
          if (featureFilter === "Track Serial Number" && !c.trackSerialNumber && !c.trackingBadges?.includes("Track Serial Number")) return false;
          if (featureFilter === "Track Warranty" && !c.trackWarranty && !c.trackingBadges?.includes("Track Warranty")) return false;
          if (featureFilter === "Track Tagging" && !c.trackTagging && !c.trackingBadges?.includes("Track Tagging")) return false;
          if (featureFilter === "Allow Request" && !c.allowRequest && !c.trackingBadges?.includes("Allow Request")) return false;
          if (featureFilter === "Manage Quantity" && !c.manageQuantity && !c.trackingBadges?.includes("Manage Quantity")) return false;
        }

        // Status filter
        if (statusFilter !== "All") {
          const currentStatus = c.status || "Active";
          if (currentStatus !== statusFilter) return false;
        }

        return true;
      });
    }, [categoryCardsWithMetrics, searchQuery, featureFilter, statusFilter]);

    return (
      <div className="space-y-4" onClick={() => {
        if (activeMenuId) setActiveMenuId(null);
        if (showCategoryDropdown) setShowCategoryDropdown(false);
      }}>
        {/* Sub Navigation Tabs matching Screenshot 1 */}
        <div className="flex items-center gap-8 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => handleSelectSubTab("category")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              subTab === "category"
                ? "text-[#253C7D]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Asset Category</span>
            {subTab === "category" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#253C7D] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab("setting")}
            className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              subTab === "setting"
                ? "text-[#253C7D] font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Asset Setting</span>
            {subTab === "setting" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#253C7D] rounded-full" />
            )}
          </button>
        </div>

        {/* Animated SubTab Presentation Container */}
        <div
          key={subTab}
          className={`w-full ${
            subTabDirection === "next" ? "animate-cover-next" : "animate-cover-prev"
          }`}
        >
          {subTab === "category" ? (
            <div className="space-y-4">
              {/* Top Row: Title & Action Button matching Screenshot 1 */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-xl font-normal text-slate-700 tracking-tight">
                  Asset Category
                </h2>

              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCategoryDropdown(!showCategoryDropdown);
                  }}
                  className="px-3.5 py-1.5 rounded-sm bg-[#253C7D] hover:bg-[#1E2E5D] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Category</span>
                  <i className="ri-arrow-down-s-line text-xs" />
                </button>

                {/* Dropdown Menu */}
                {showCategoryDropdown && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-9 w-48 rounded-md bg-white border border-slate-200/90 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryDropdown(false);
                        setEditingCategory(null);
                        setShowCategoryModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <i className="ri-add-circle-line text-base text-slate-500" />
                      <span>Create Category</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryDropdown(false);
                        onOpenAssetModalForCategory("");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <i className="ri-box-3-line text-base text-slate-500" />
                      <span>Register Asset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Navigation Trigger on left */}
            {onSelectTab && (
              <div className="flex items-center gap-4">
                <AssetNavDropdown currentTab="categories" onSelectTab={onSelectTab} />
              </div>
            )}

            {/* Filter Bar matching Screenshot 1 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Box with blue search button attached on right */}
              <div className="flex rounded-sm overflow-hidden border border-slate-300 bg-white max-w-sm w-full shadow-2xs focus-within:border-[#253C7D] h-8">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
                />
                <button
                  type="button"
                  className="px-3 bg-[#253C7D] hover:bg-[#1E2E5D] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-search-line text-xs" />
                </button>
              </div>

              {/* Filter Pills matching Screenshot 1 */}
              <div className="flex items-center gap-2">
                {/* Features Filter Pill */}
                <div className="relative">
                  <select
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="appearance-none px-4 py-1.5 pr-8 rounded-full border border-slate-300 text-xs text-slate-600 bg-white hover:border-slate-400 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
                  >
                    <option value="All">Features</option>
                    <option value="Track Serial Number">Track Serial Number</option>
                    <option value="Track Warranty">Track Warranty</option>
                    <option value="Track Tagging">Track Tagging</option>
                    <option value="Allow Request">Allow Request</option>
                    <option value="Manage Quantity">Manage Quantity</option>
                  </select>
                  <i className="ri-arrow-down-s-line text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Status Filter Pill */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none px-4 py-1.5 pr-8 rounded-full border border-slate-300 text-xs text-slate-600 bg-white hover:border-slate-400 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
                  >
                    <option value="All">Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <i className="ri-arrow-down-s-line text-slate-400 text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid of Asset Category Cards matching Screenshot 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-md border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between p-4 group"
                >
                  <div>
                    {/* Card Top: Title, Optional Thumbnail & 3-dot Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {card.imageUrl && (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                          />
                        )}
                        <h3
                          onClick={() => onSelectCategory(card.name)}
                          className="text-xs font-bold text-slate-800 leading-snug cursor-pointer hover:text-[#253C7D] transition-colors"
                          title={card.name}
                        >
                          {card.name}
                        </h3>
                      </div>

                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === card.id ? null : card.id);
                          }}
                          className="w-5 h-5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <i className="ri-more-2-fill text-sm" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === card.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-6 w-44 rounded-lg bg-white border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onSelectCategory(card.name);
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <i className="ri-eye-line text-slate-400" />
                              <span>View Assets ({card.metrics.total})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenAssetModalForCategory(card.name);
                              }}
                              className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-[#253C7D] hover:bg-[#253C7D]/10 flex items-center gap-2 cursor-pointer"
                            >
                              <i className="ri-add-circle-line" />
                              <span>+ Add Asset</span>
                            </button>
                            {canManage && (
                              <>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setEditingCategory(card);
                                    setShowCategoryModal(true);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <i className="ri-edit-line text-slate-400" />
                                  <span>Edit Category</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDeleteCategory(card.id);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <i className="ri-delete-bin-line" />
                                  <span>Delete Category</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SubType in Blue Font matching Screenshot 1 */}
                    <p className="text-[11px] font-semibold text-[#253C7D] mt-2">
                      {card.subType}
                    </p>

                    {/* Tracking Badges matching Screenshot 1 */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      {card.trackingBadges?.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 rounded border border-slate-200 bg-white text-[10px] text-slate-600 shadow-2xs whitespace-nowrap"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>

                    {/* Attachments Document Count Indicator */}
                    {card.attachments && card.attachments.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <i className="ri-attachment-line text-[#253C7D]" />
                        <span>{card.attachments.length} document(s) attached</span>
                      </div>
                    )}

                    {/* Seller & Serial Tracking Info if present */}
                    {(card.sellerName || card.serialNumber || (card.serialNumbersList && card.serialNumbersList.length > 0)) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                        {card.sellerName && (
                          <p className="truncate">
                            <span className="font-semibold text-slate-600">Seller:</span> {card.sellerName}
                          </p>
                        )}
                        {card.serialNumbersList && card.serialNumbersList.length > 0 ? (
                          <p className="font-mono text-emerald-700">
                            <span className="font-semibold">Batch S/N:</span> {card.serialNumbersList.length} items
                          </p>
                        ) : card.serialNumber ? (
                          <p className="font-mono truncate">
                            <span className="font-semibold">S/N:</span> {card.serialNumber}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* 4-Column Stats Footer matching Screenshot 1 */}
                  <div className="border-t border-slate-100 pt-3 mt-4 grid grid-cols-4 text-center divide-x divide-slate-100">
                    <div className="px-1">
                      <p className="text-sm font-bold text-slate-800 leading-none">
                        {card.metrics.total}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Total</p>
                    </div>

                    <div className="px-1">
                      <p className="text-sm font-bold text-slate-800 leading-none">
                        {card.metrics.assigned}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Assigned</p>
                    </div>

                    <div className="px-1">
                      <p className="text-sm font-bold text-slate-800 leading-none">
                        {card.metrics.issue}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Issue</p>
                    </div>

                    <div className="px-1">
                      <p className="text-sm font-bold text-[#00aa66] leading-none">
                        {card.metrics.available}
                      </p>
                      <p className="text-[10px] text-[#00aa66] font-medium mt-1">Available</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          ) : (
            /* Asset Setting Tab View (Matching Screenshot 1 & 2) */
            <AssetSettingView
              categories={categoriesList}
              onUpdateCategoryTags={(tagsMap) => {
                const updated = categoriesList.map((c) => ({
                  ...c,
                  tag: tagsMap[c.id] !== undefined ? tagsMap[c.id] : c.tag,
                }));
                saveCategories(updated);
              }}
            />
          )}
        </div>

        {/* Modal for Creating / Editing Asset Category */}
        <CreateAssetCategoryModal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleCreateOrUpdateCategory}
          initialData={editingCategory}
        />
      </div>
    );
  }
);
