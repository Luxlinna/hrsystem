import { memo } from "react";

interface RecycleBinStatsRowProps {
  totalItems: number;
  activeModulesCount: number;
}

export const RecycleBinStatsRow = memo(function RecycleBinStatsRow({
  totalItems,
  activeModulesCount,
}: RecycleBinStatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Deleted</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalItems}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
          <i className="ri-delete-bin-line" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Affected Modules</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{activeModulesCount}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0088cc] flex items-center justify-center text-lg">
          <i className="ri-apps-2-line" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">Retention Policy:</span> Items remain recoverable until purged permanently. Restoring re-links records immediately.
        </p>
      </div>
    </div>
  );
});
