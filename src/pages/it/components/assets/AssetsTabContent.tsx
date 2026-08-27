import { memo } from "react";
import type { ITAsset } from "../../types";
import { ASSET_TYPE_CONFIG } from "../../constants";
import { AssetCard } from "./AssetCard";
import { AssetsTableView } from "./AssetsTableView";

interface AssetsTabContentProps {
  assets: ITAsset[];
  assetTypeStats: [string, number][];
  totalAssetsCount: number;
  viewMode: "table" | "cards";
  canManage: boolean;
  onOpenAssetModal: () => void;
  onEditAsset: (asset: ITAsset) => void;
  onDeleteAsset: (asset: ITAsset) => void;
}

export const AssetsTabContent = memo(function AssetsTabContent({
  assets,
  assetTypeStats,
  totalAssetsCount,
  viewMode,
  canManage,
  onOpenAssetModal,
  onEditAsset,
  onDeleteAsset,
}: AssetsTabContentProps) {
  return (
    <div className="space-y-6">
      {/* Asset Type Distribution Progress Bar */}
      {assetTypeStats.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Asset Category Allocation
            </h3>
            <span className="text-xs font-bold text-gray-400">
              {totalAssetsCount} Total Registered Units
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {assetTypeStats.map(([type, count]) => {
              const cfg = ASSET_TYPE_CONFIG[type] || ASSET_TYPE_CONFIG.Other;
              return (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <i className={`${cfg.icon} ${cfg.color} text-sm`} />
                  <span className="text-xs font-bold text-gray-700">{cfg.label}:</span>
                  <span className="text-xs font-black text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Asset Data */}
      {assets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-macbook-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No IT Assets Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No hardware devices match your search query or selected type and branch filters.
          </p>
          {canManage && (
            <button
              onClick={onOpenAssetModal}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Register New Asset
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <AssetsTableView
            assets={assets}
            canManage={canManage}
            onEdit={onEditAsset}
            onDelete={onDeleteAsset}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((a) => (
            <AssetCard
              key={a.id}
              asset={a}
              canManage={canManage}
              onEdit={onEditAsset}
              onDelete={onDeleteAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
});
