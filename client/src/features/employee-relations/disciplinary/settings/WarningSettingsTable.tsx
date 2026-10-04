import { memo, useState } from "react";
import type { WarningTypeSetting } from "./types";

interface WarningSettingsTableProps {
  warningTypes: WarningTypeSetting[];
  onOpenEdit: (item: WarningTypeSetting) => void;
  onToggleStatus: (id: string, currentStatus: "active" | "inactive") => void;
  onDelete: (id: string, name: string) => void;
}

export const WarningSettingsTable = memo(function WarningSettingsTable({
  warningTypes,
  onOpenEdit,
  onToggleStatus,
  onDelete,
}: WarningSettingsTableProps) {
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  return (
    <div className="border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50/70">
            <th className="px-4 py-3 w-14">No.</th>
            <th className="px-4 py-3 min-w-[140px]">Warning Type Name</th>
            <th className="px-4 py-3 min-w-[150px]">Alert Day After Warning(day)</th>
            <th className="px-4 py-3 min-w-[160px]">Stop Alert After Alert Day(day)</th>
            <th className="px-4 py-3">Remark</th>
            <th className="px-4 py-3 text-center w-24">Status</th>
            <th className="px-4 py-3 text-right w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {warningTypes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                No warning types found
              </td>
            </tr>
          ) : (
            warningTypes.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 text-slate-500 font-semibold">{idx + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-slate-700">{item.alert_days_after}</td>
                <td className="px-4 py-3 text-slate-700">{item.stop_alert_days}</td>
                <td className="px-4 py-3 text-slate-500 max-w-sm truncate" title={item.remark || ""}>
                  {item.remark || ""}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      item.status === "active"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {item.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right relative">
                  <button
                    type="button"
                    onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    <i className="ri-settings-3-line text-xs" />
                    <i className="ri-arrow-down-s-line text-xs text-slate-400" />
                  </button>

                  {actionMenuId === item.id && (
                    <div className="absolute right-4 top-10 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setActionMenuId(null);
                          onOpenEdit(item);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-edit-line text-slate-400" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionMenuId(null);
                          onToggleStatus(item.id, item.status);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-toggle-line text-slate-400" />
                        {item.status === "active" ? "Set Inactive" : "Set Active"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionMenuId(null);
                          if (window.confirm(`Delete warning type "${item.name}"?`)) {
                            onDelete(item.id, item.name);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                      >
                        <i className="ri-delete-bin-line" />
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
