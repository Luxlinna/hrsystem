import { memo, useState } from "react";
import { DisciplinaryDateFilter } from "./DisciplinaryDateFilter";

interface WarningFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterDateOption: string;
  setFilterDateOption: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onExportCSV?: () => void;
}

export const WarningFilterBar = memo(function WarningFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterDateOption,
  setFilterDateOption,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExportCSV,
}: WarningFilterBarProps) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mb-3">
      {/* Left: Search input with Blue Search button in logo primary color #253C7D */}
      <div className="flex items-center w-full md:w-72">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-2 py-1.5 text-xs bg-white border border-r-0 border-slate-300 rounded-l focus:outline-none focus:border-[#253C7D] text-slate-800"
          />
        </div>
        <button
          type="button"
          title="Search"
          className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3066] text-white border border-[#253C7D] rounded-r flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Right: Pill Filters matching Warnings ERP Screenshot */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* Export Dropdown Pill */}
        {onExportCSV && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExport(!showExport)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-full bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-download-2-line text-xs" />
              <span>Export</span>
              <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
            </button>
            {showExport && (
              <div className="absolute right-0 top-7 w-36 bg-white border border-slate-200 rounded shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExport(false);
                    onExportCSV();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-file-text-line text-[#253C7D] text-sm" />
                  <span>CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Warning Type Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1 text-xs border border-slate-300 rounded-full bg-white text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs"
        >
          <option value="">Warning Type</option>
          <option value="First Written">First Written</option>
          <option value="Second Written">Second Written</option>
          <option value="Final Warning">Final Warning</option>
          <option value="Verbal">Verbal</option>
          <option value="Instruction">Instruction</option>
          <option value="Notice">Notice</option>
          <option value="Suspense">Suspense</option>
        </select>

        {/* Date Filter Pill with Presets + Custom Date Range */}
        <DisciplinaryDateFilter
          filterDateOption={filterDateOption}
          setFilterDateOption={setFilterDateOption}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {/* Status Dropdown Pill */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1 text-xs border border-slate-300 rounded-full bg-white text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs"
        >
          <option value="">Status</option>
          <option value="Recorded">Recorded</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Settings Icon Button */}
        <button
          type="button"
          title="Settings"
          className="w-7 h-7 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
        >
          <i className="ri-settings-3-line text-xs" />
        </button>
      </div>
    </div>
  );
});
