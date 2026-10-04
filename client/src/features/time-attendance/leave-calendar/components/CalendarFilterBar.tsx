import { memo } from "react";
import { LEAVE_TYPE_CONFIG } from "../constants";

interface CalendarFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  deptFilter: string;
  setDeptFilter: (dept: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  statusFilter: "approved" | "pending" | "all";
  setStatusFilter: (status: "approved" | "pending" | "all") => void;
  departments: string[];
}

export const CalendarFilterBar = memo(function CalendarFilterBar({
  searchQuery,
  setSearchQuery,
  deptFilter,
  setDeptFilter,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  departments,
}: CalendarFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter leave calendar by employee name, role, department, reason..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
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

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {departments.length > 0 && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Leave Types</option>
          {Object.keys(LEAVE_TYPE_CONFIG).map((t) => (
            <option key={t} value={t}>
              {LEAVE_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "approved" | "pending" | "all")}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="approved">Approved Only</option>
          <option value="pending">Pending Only</option>
          <option value="all">All Statuses</option>
        </select>
      </div>
    </div>
  );
});
