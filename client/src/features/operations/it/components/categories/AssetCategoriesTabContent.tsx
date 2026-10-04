import React, { useState, useMemo, memo } from "react";
import type { ITAsset, ITTabType } from "../../types";
import { STANDARD_ASSET_CATEGORIES, type AssetCategoryCardConfig } from "../../constants";
import { CreateAssetCategoryModal, type AssetCategoryFormData } from "./CreateAssetCategoryModal";
import { AssetSettingView } from "./AssetSettingView";
import { AssetNavDropdown } from "../navigation/AssetNavDropdown";
import { AssetCategoryCardItem, type CategoryCardWithMetrics } from "./tab/AssetCategoryCardItem";
import { AssetCategoryFilterBar } from "./tab/AssetCategoryFilterBar";
import { AssetCategoryHeaderActions } from "./tab/AssetCategoryHeaderActions";

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
    const [subTab, setSubTab] = useState<"category" | "setting">("category");
    const [subTabDirection, setSubTabDirection] = useState<"next" | "prev">("next");

    const handleSelectSubTab = (newSubTab: "category" | "setting") => {
      setSubTabDirection(newSubTab === "setting" ? "next" : "prev");
      setSubTab(newSubTab);
    };

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

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AssetCategoryCardConfig | null>(null);

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

    const categoryCardsWithMetrics: CategoryCardWithMetrics[] = useMemo(() => {
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
          metrics: { total, assigned, issue, available },
        };
      });
    }, [categoriesList, assets]);

    const filteredCards = useMemo(() => {
      return categoryCardsWithMetrics.filter((c) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = c.name.toLowerCase().includes(q);
          const matchType = c.subType.toLowerCase().includes(q);
          const matchTag = (c.tag || "").toLowerCase().includes(q);
          const matchBadges = c.trackingBadges?.some((b) => b.toLowerCase().includes(q));
          if (!matchName && !matchType && !matchTag && !matchBadges) return false;
        }

        if (featureFilter !== "All") {
          if (featureFilter === "Track Serial Number" && !c.trackSerialNumber && !c.trackingBadges?.includes("Track Serial Number")) return false;
          if (featureFilter === "Track Warranty" && !c.trackWarranty && !c.trackingBadges?.includes("Track Warranty")) return false;
          if (featureFilter === "Track Tagging" && !c.trackTagging && !c.trackingBadges?.includes("Track Tagging")) return false;
          if (featureFilter === "Allow Request" && !c.allowRequest && !c.trackingBadges?.includes("Allow Request")) return false;
          if (featureFilter === "Manage Quantity" && !c.manageQuantity && !c.trackingBadges?.includes("Manage Quantity")) return false;
        }

        if (statusFilter !== "All") {
          const currentStatus = c.status || "Active";
          if (currentStatus !== statusFilter) return false;
        }

        return true;
      });
    }, [categoryCardsWithMetrics, searchQuery, featureFilter, statusFilter]);

    return (
      <div
        className="space-y-4"
        onClick={() => {
          if (activeMenuId) setActiveMenuId(null);
          if (showCategoryDropdown) setShowCategoryDropdown(false);
        }}
      >
        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => handleSelectSubTab("category")}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              subTab === "category" ? "text-[#253C7D]" : "text-slate-500 hover:text-slate-800"
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
              subTab === "setting" ? "text-[#253C7D] font-bold" : "text-slate-500 hover:text-slate-800"
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
              <AssetCategoryHeaderActions
                showCategoryDropdown={showCategoryDropdown}
                setShowCategoryDropdown={setShowCategoryDropdown}
                onOpenCreateCategory={() => {
                  setShowCategoryDropdown(false);
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                onOpenRegisterAsset={() => {
                  setShowCategoryDropdown(false);
                  onOpenAssetModalForCategory("");
                }}
              />

              {onSelectTab && (
                <div className="flex items-center gap-4">
                  <AssetNavDropdown currentTab="categories" onSelectTab={onSelectTab} />
                </div>
              )}

              <AssetCategoryFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                featureFilter={featureFilter}
                setFeatureFilter={setFeatureFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              {/* Grid of Asset Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {filteredCards.map((card) => (
                  <AssetCategoryCardItem
                    key={card.id}
                    card={card}
                    canManage={canManage}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    onSelectCategory={onSelectCategory}
                    onOpenAssetModalForCategory={onOpenAssetModalForCategory}
                    onEditCategory={(c) => {
                      setEditingCategory(c);
                      setShowCategoryModal(true);
                    }}
                    onDeleteCategory={handleDeleteCategory}
                  />
                ))}
              </div>
            </div>
          ) : (
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
