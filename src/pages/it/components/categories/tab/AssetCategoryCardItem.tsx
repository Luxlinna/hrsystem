import { memo } from "react";
import type { AssetCategoryCardConfig } from "../../../constants";

export interface CategoryCardWithMetrics extends AssetCategoryCardConfig {
  metrics: {
    total: number;
    assigned: number;
    issue: number;
    available: number;
  };
}

interface AssetCategoryCardItemProps {
  card: CategoryCardWithMetrics;
  canManage: boolean;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onSelectCategory: (name: string) => void;
  onOpenAssetModalForCategory: (name: string) => void;
  onEditCategory: (card: AssetCategoryCardConfig) => void;
  onDeleteCategory: (id: string) => void;
}

export const AssetCategoryCardItem = memo(function AssetCategoryCardItem({
  card,
  canManage,
  activeMenuId,
  setActiveMenuId,
  onSelectCategory,
  onOpenAssetModalForCategory,
  onEditCategory,
  onDeleteCategory,
}: AssetCategoryCardItemProps) {
  return (
    <div className="bg-white rounded-md border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between p-4 group">
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
                        onEditCategory(card);
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
                        onDeleteCategory(card.id);
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

        {/* SubType */}
        <p className="text-[11px] font-semibold text-[#253C7D] mt-2">
          {card.subType}
        </p>

        {/* Tracking Badges */}
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

      {/* 4-Column Stats Footer */}
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
  );
});
