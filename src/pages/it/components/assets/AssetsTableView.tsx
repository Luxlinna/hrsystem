import { memo } from "react";
import { Link } from "react-router-dom";
import type { ITAsset } from "../../types";
import { ASSET_TYPE_CONFIG, ASSET_STATUS_CONFIG } from "../../constants";
import { initials } from "../../itUtils";

interface AssetsTableViewProps {
  assets: ITAsset[];
  canManage: boolean;
  onEdit: (asset: ITAsset) => void;
  onDelete: (asset: ITAsset) => void;
}

export const AssetsTableView = memo(function AssetsTableView({
  assets,
  canManage,
  onEdit,
  onDelete,
}: AssetsTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="px-5 py-3.5">Asset Tag & Device</th>
            <th className="px-5 py-3.5">Type</th>
            <th className="px-5 py-3.5">Assigned Holder</th>
            <th className="px-5 py-3.5">Location</th>
            <th className="px-5 py-3.5">Serial Number</th>
            <th className="px-5 py-3.5">Status</th>
            {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assets.map((a) => {
            const typeCfg = ASSET_TYPE_CONFIG[a.type] || ASSET_TYPE_CONFIG.Other;
            const statusCfg = ASSET_STATUS_CONFIG[a.status] || ASSET_STATUS_CONFIG.active;

            return (
              <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${typeCfg.bg} ${typeCfg.color}`}>
                      <i className={typeCfg.icon} />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs sm:text-[13px]">{a.name}</p>
                      <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                        {a.asset_tag}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-bold text-gray-700 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
                    {a.type}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  {a.employees ? (
                    <Link
                      to={`/employees/${a.employees.id}`}
                      className="flex items-center gap-2 font-bold text-gray-900 hover:text-[#253C7D] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {initials(a.employees.first_name, a.employees.last_name)}
                      </div>
                      <span>{a.employees.first_name} {a.employees.last_name}</span>
                    </Link>
                  ) : (
                    <span className="text-gray-400 font-semibold italic text-[11px]">Unassigned (Pool)</span>
                  )}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                  {a.branches?.name || "General Headquarters"}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-mono text-gray-500 text-[11px]">
                  {a.serial_number || "—"}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </td>

                {canManage && (
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(a)}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
