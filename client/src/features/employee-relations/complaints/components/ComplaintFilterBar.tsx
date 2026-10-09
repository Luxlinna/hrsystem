import { memo, useState } from "react";
import { ComplaintDateFilter } from "./ComplaintDateFilter";
import { COMPLAINT_STATUS_CONFIG, COMPLAINT_STATUS_ORDER } from "../constants";

interface ComplaintFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterDateOption: string;
  setFilterDateOption: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
}

export const ComplaintFilterBar = memo(function ComplaintFilterBar({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterDateOption,
  setFilterDateOption,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExportCSV,
  onExportXLSX,
}: ComplaintFilterBarProps) {
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

      {/* Right: Pill Filters matching Exit, Warning & Employee filter bars */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {/* Export Dropdown Pill */}
        {(onExportCSV || onExportXLSX) && (
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
                {onExportXLSX && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExport(false);
                      onExportXLSX();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
                    <span>Excel (.xlsx)</span>
                  </button>
                )}
                {onExportCSV && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowExport(false);
                      onExportCSV();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                  >
                    <i className="ri-file-text-line text-[#253C7D] text-sm" />
                    <span>CSV (.csv)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Dropdown Pill */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1 text-xs border border-slate-300 rounded-full bg-white text-slate-700 hover:bg-slate-50 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs"
        >
          <option value="all">Status</option>
          {COMPLAINT_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {COMPLAINT_STATUS_CONFIG[s]?.label || s}
            </option>
          ))}
        </select>

        {/* Date Filter Pill */}
        <ComplaintDateFilter
          filterDateOption={filterDateOption}
          setFilterDateOption={setFilterDateOption}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {/* Filter Setting Icon Button */}
        <button
          type="button"
          title="Filter Settings"
          className="w-7 h-7 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
        >
          <i className="ri-settings-3-line text-xs" />
        </button>
      </div>
    </div>
  );
});
