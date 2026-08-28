import { memo } from "react";
import type { DatePreset, ViewMode } from "../types";
import { STATUS_CONFIG } from "../constants";

interface AttendanceControlBarProps {
  canManage: boolean;
  filteredRecordsCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterDatePreset: DatePreset;
  setFilterDatePreset: (preset: DatePreset) => void;
  singleDate: string;
  setSingleDate: (date: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  todayYMD: string;
}

export const AttendanceControlBar = memo(function AttendanceControlBar({
  canManage,
  filteredRecordsCount,
  searchQuery,
  setSearchQuery,
  filterDatePreset,
  setFilterDatePreset,
  singleDate,
  setSingleDate,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  departments,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
  todayYMD,
}: AttendanceControlBarProps) {
  const isFiltered =
    searchQuery ||
    filterDepartment !== "all" ||
    filterStatus !== "all" ||
    filterDatePreset !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterDepartment("all");
    setFilterStatus("all");
    setFilterDatePreset("all");
    setFromDate("");
    setToDate("");
    setSingleDate(todayYMD);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
      {/* Records Header / Count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] rounded-xl font-bold text-xs">
          <i className="ri-calendar-check-line text-sm" />
          <span>Attendance Records</span>
          <span className="bg-[#253C7D] text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold leading-none">
            {filteredRecordsCount}
          </span>
        </div>
      </div>

      {/* Filters: Search, Historical Date Range Selector & Department Dropdown */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Live Search */}
        <div className="relative w-full sm:w-48">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, date..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* Historical Date Preset Dropdown */}
        <select
          value={filterDatePreset}
          onChange={(e) => setFilterDatePreset(e.target.value as DatePreset)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
        >
          <option value="all">📅 All Historical Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="last_week">Last Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
          <option value="last_year">Last Year</option>
          <option value="single_date">Specific Date...</option>
          <option value="custom_range">Custom Date Range...</option>
        </select>

        {/* Single Historical Date Picker */}
        {filterDatePreset === "single_date" && (
          <input
            type="date"
            value={singleDate}
            onChange={(e) => setSingleDate(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
          />
        )}

        {/* Custom Date Range Pickers */}
        {filterDatePreset === "custom_range" && (
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="From"
              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
            />
            <span className="text-[10px] text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="To"
              className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        )}

        {/* Department Filter */}
        {departments.length > 0 && canManage && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[125px] truncate font-medium"
          >
            <option value="all">All Depts</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
          <button
            onClick={() => setViewMode("table")}
            title="Table View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-table-line" />
          </button>
          <button
            onClick={() => setViewMode("cards")}
            title="Cards View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            title="Reset Filters"
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <i className="ri-refresh-line text-sm" />
          </button>
        )}
      </div>
    </div>
  );
});
