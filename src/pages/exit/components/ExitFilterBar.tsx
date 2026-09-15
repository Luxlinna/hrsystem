import { memo } from "react";
import { EXIT_TYPE_CONFIG, EXIT_TYPE_ORDER } from "../constants";

interface ExitFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterExitType: string;
  setFilterExitType: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
}

export const ExitFilterBar = memo(function ExitFilterBar({
  searchQuery, setSearchQuery,
  filterExitType, setFilterExitType,
  filterDateFrom, setFilterDateFrom,
  filterDateTo, setFilterDateTo,
}: ExitFilterBarProps) {
  const hasFilters = searchQuery || filterExitType !== "all" || filterDateFrom || filterDateTo;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search employee name or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all"
          />
        </div>

        {/* Exit Type */}
        <select
          value={filterExitType}
          onChange={(e) => setFilterExitType(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none"
        >
          <option value="all">All Types</option>
          {EXIT_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>{EXIT_TYPE_CONFIG[t].label}</option>
          ))}
        </select>

        {/* Date From */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">From</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">To</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterExitType("all");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line" />Clear
          </button>
        )}
      </div>
    </div>
  );
});
