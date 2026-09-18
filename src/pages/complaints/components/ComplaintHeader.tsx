import { memo } from "react";

interface ComplaintHeaderProps {
  viewMode: "table" | "cards";
  onViewModeChange: (mode: "table" | "cards") => void;
  onNew: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
}

export const ComplaintHeader = memo(function ComplaintHeader({
  viewMode,
  onViewModeChange,
  onNew,
  onExportCSV,
  onExportXLSX,
}: ComplaintHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
          <i className="ri-feedback-line" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Complaints &amp; Suggestions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track grievances, employee feedback, and improvement suggestions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Table / Cards View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === "table"
                ? "bg-white text-slate-800 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Table View"
          >
            <i className="ri-table-line text-sm" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("cards")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === "cards"
                ? "bg-white text-slate-800 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-700"
            }`}
            title="Cards View"
          >
            <i className="ri-grid-line text-sm" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>

        {/* Export Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs">
            <i className="ri-download-line text-slate-500" />
            <span>Export</span>
            <i className="ri-arrow-down-s-line text-slate-400" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <button
              onClick={onExportXLSX}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <i className="ri-file-excel-2-line text-emerald-600" />
              Excel (.xlsx)
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
            >
              <i className="ri-file-text-line text-sky-600" />
              CSV (.csv)
            </button>
          </div>
        </div>

        {/* New Button */}
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer bg-[#0284c7] hover:bg-sky-700"
        >
          <i className="ri-add-line text-sm" />
          New Entry
        </button>
      </div>
    </div>
  );
});
