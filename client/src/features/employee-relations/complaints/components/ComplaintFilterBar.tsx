import { memo } from "react";
import {
  COMPLAINT_TYPE_CONFIG,
  COMPLAINT_TYPE_ORDER,
  COMPLAINT_STATUS_CONFIG,
  COMPLAINT_STATUS_ORDER,
} from "../constants";

interface ComplaintFilterBarProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterDateFrom: string;
  setFilterDateFrom: (v: string) => void;
  filterDateTo: string;
  setFilterDateTo: (v: string) => void;
}

export const ComplaintFilterBar = memo(function ComplaintFilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterDateFrom,
  setFilterDateFrom,
  filterDateTo,
  setFilterDateTo,
}: ComplaintFilterBarProps) {
  const hasFilters =
    Boolean(searchQuery) ||
    filterType !== "all" ||
    filterStatus !== "all" ||
    Boolean(filterDateFrom) ||
    Boolean(filterDateTo);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search subject, details, recipient, notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED] focus:bg-white transition-all"
          />
        </div>

        {/* Category Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7C3AED] cursor-pointer"
        >
          <option value="all">All Categories</option>
          {COMPLAINT_TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {COMPLAINT_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#7C3AED] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {COMPLAINT_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {COMPLAINT_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-medium">From</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#7C3AED] cursor-pointer"
          />
        </div>

        {/* Date To */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-medium">To</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#7C3AED] cursor-pointer"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterType("all");
              setFilterStatus("all");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
});
