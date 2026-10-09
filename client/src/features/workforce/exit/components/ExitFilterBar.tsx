import { memo, useState } from "react";
import { EXIT_TYPE_CONFIG, EXIT_TYPE_ORDER, REASON_TYPE_CONFIG, REASON_TYPE_ORDER } from "../constants";

interface ExitFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterExitType: string;
  setFilterExitType: (v: string) => void;
  filterReasonType?: string;
  setFilterReasonType?: (v: string) => void;
  showSalary: boolean;
  onToggleSalary: () => void;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  exitTypeOptions?: Array<{ id: string; name: string }>;
}

export const ExitFilterBar = memo(function ExitFilterBar({
  searchQuery,
  setSearchQuery,
  filterExitType,
  setFilterExitType,
  filterReasonType = "all",
  setFilterReasonType,
  showSalary,
  onToggleSalary,
  onExportCSV,
  onExportXLSX,
  exitTypeOptions = [],
}: ExitFilterBarProps) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mb-3">
      {/* Left: Search input with Blue Search button */}
      <div className="flex items-center w-full md:w-72">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l focus:outline-none focus:border-[#253C7D] dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          title="Search"
          className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3066] text-white border border-[#253C7D] rounded-r flex items-center justify-center cursor-pointer transition-colors"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Right: Pill Filters matching screenshot */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* Export / Import Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExport(!showExport)}
            className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <i className="ri-download-2-line text-xs" />
            <span>Export</span>
            <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
          </button>
          {showExport && (
            <div className="absolute right-0 top-7 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              {onExportXLSX && (
                <button
                  type="button"
                  onClick={() => { setShowExport(false); onExportXLSX(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
                  <span>Excel (.xlsx)</span>
                </button>
              )}
              {onExportCSV && (
                <button
                  type="button"
                  onClick={() => { setShowExport(false); onExportCSV(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-slate-700"
                >
                  <i className="ri-file-text-line text-sky-600 text-sm" />
                  <span>CSV (.csv)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reason Type Filter */}
        {setFilterReasonType && (
          <select
            value={filterReasonType}
            onChange={(e) => setFilterReasonType(e.target.value)}
            className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs"
          >
            <option value="all">Reason Type</option>
            {REASON_TYPE_ORDER.map((r) => (
              <option key={r} value={r}>{REASON_TYPE_CONFIG[r]?.label || r}</option>
            ))}
          </select>
        )}

        {/* Exit Type Filter */}
        <select
          value={filterExitType}
          onChange={(e) => setFilterExitType(e.target.value)}
          className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs"
        >
          <option value="all">Exit Type</option>
          {exitTypeOptions.length > 0
            ? exitTypeOptions.map((t) => <option key={t.id || t.name} value={t.name}>{t.name}</option>)
            : EXIT_TYPE_ORDER.map((t) => <option key={t} value={t}>{EXIT_TYPE_CONFIG[t]?.label || t}</option>)}
        </select>

        {/* Show Salary Toggle Pill */}
        <button
          type="button"
          onClick={onToggleSalary}
          className={`px-3 py-1 text-xs border rounded-full transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 ${
            showSalary
              ? "bg-[#253C7D] text-white border-[#253C7D]"
              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          }`}
        >
          <i className={showSalary ? "ri-eye-line text-xs" : "ri-eye-off-line text-xs"} />
          <span>Show Salary</span>
        </button>
      </div>
    </div>
  );
});

