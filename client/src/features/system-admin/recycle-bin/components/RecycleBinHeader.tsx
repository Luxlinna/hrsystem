import { memo } from "react";

interface RecycleBinHeaderProps {
  working: boolean;
  totalCount?: number;
  onRefresh: () => void;
}

export const RecycleBinHeader = memo(function RecycleBinHeader({
  working,
  totalCount = 0,
  onRefresh,
}: RecycleBinHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <span>WORKSPACE</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">SYSTEM ADMIN</span>
        </div>
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Recycle Bin
          </h1>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {totalCount} deleted item{totalCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review, restore, or permanently purge soft-deleted records across all organization modules.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={working}
        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
      >
        <i className={`ri-refresh-line text-sm ${working ? "animate-spin text-[#0088cc]" : ""}`} />
        <span>Refresh</span>
      </button>
    </div>
  );
});
