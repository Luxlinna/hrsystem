import { memo } from "react";
import { Link } from "react-router-dom";
import type { ITAsset } from "../../types";
import { ASSET_TYPE_CONFIG, ASSET_STATUS_CONFIG } from "../../constants";
import { initials } from "../../itUtils";

interface AssetCardProps {
  asset: ITAsset;
  canManage: boolean;
  onEdit: (asset: ITAsset) => void;
  onDelete: (asset: ITAsset) => void;
}

export const AssetCard = memo(function AssetCard({
  asset,
  canManage,
  onEdit,
  onDelete,
}: AssetCardProps) {
  const typeCfg = ASSET_TYPE_CONFIG[asset.type] || ASSET_TYPE_CONFIG.Other;
  const statusCfg = ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.active;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 ${typeCfg.bg} ${typeCfg.color}`}>
              <i className={typeCfg.icon} />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                {asset.name}
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                {asset.asset_tag}
              </p>
            </div>
          </div>

          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 flex items-center gap-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Assigned Holder / Branch Location */}
        <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs mb-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">Assigned To:</span>
            {asset.employees ? (
              <Link
                to={`/employees/${asset.employees.id}`}
                className="font-bold text-gray-900 hover:text-[#253C7D] flex items-center gap-1.5 truncate max-w-[150px]"
              >
                <div className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-bold flex items-center justify-center shrink-0">
                  {initials(asset.employees.first_name, asset.employees.last_name)}
                </div>
                <span className="truncate">{asset.employees.first_name} {asset.employees.last_name}</span>
              </Link>
            ) : (
              <span className="text-gray-400 font-semibold italic">Unassigned (Pool)</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-[11px]">Location:</span>
            <span className="font-bold text-gray-700 truncate max-w-[150px]">
              {asset.branches?.name || "General Headquarters"}
            </span>
          </div>

          {asset.serial_number && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-[11px]">Serial:</span>
              <span className="font-mono text-gray-600 text-[11px] truncate max-w-[150px]">
                {asset.serial_number}
              </span>
            </div>
          )}
        </div>
      </div>

      {canManage && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(asset)}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Asset"
          >
            <i className="ri-edit-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(asset)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Asset"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      )}
    </div>
  );
});
