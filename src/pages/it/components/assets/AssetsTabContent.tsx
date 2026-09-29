import { memo } from "react";
import type { ITAsset } from "../../types";
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
  selectedAssetIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export const AssetsTabContent = memo(function AssetsTabContent({
  assets,
  viewMode,
  canManage,
  onOpenAssetModal,
  onEditAsset,
  onDeleteAsset,
  selectedAssetIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: AssetsTabContentProps) {
  return (
    <div>
      {/* Main Asset Data matching Screenshot 1 */}
      {viewMode === "table" ? (
        <AssetsTableView
          assets={assets}
          canManage={canManage}
          onEdit={onEditAsset}
          onDelete={onDeleteAsset}
          selectedAssetIds={selectedAssetIds}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
        />
      ) : assets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-sm border border-slate-200 shadow-2xs">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-sm flex items-center justify-center text-2xl mx-auto mb-2.5">
            <i className="ri-macbook-line" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No IT Assets Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No hardware devices match your filter criteria.
          </p>
          {canManage && (
            <button
              onClick={onOpenAssetModal}
              className="mt-3 px-3.5 py-1.5 bg-[#2585c8] text-white text-xs font-medium rounded-sm shadow-2xs hover:bg-[#1f73b0] transition-all cursor-pointer"
            >
              + Register New Asset
            </button>
          )}
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


