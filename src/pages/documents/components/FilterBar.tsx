import { memo } from "react";
import type { StatusFilter, ViewMode } from "../types";

interface FilterBarProps {
  search: string;
  setSearch: (search: string) => void;
  visibilityFilter: string;
  setVisibilityFilter: (vis: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFilterChangeResetPage: () => void;
}

export const FilterBar = memo(function FilterBar({
  search,
  setSearch,
  visibilityFilter,
  setVisibilityFilter,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  onFilterChangeResetPage,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onFilterChangeResetPage();
          }}
          placeholder="Search documents by title, author, tag, or description..."
          className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Visibility Filter */}
        <select
          value={visibilityFilter}
          onChange={(e) => {
            setVisibilityFilter(e.target.value);
            onFilterChangeResetPage();
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
        >
          <option value="all">All Audiences</option>
          <option value="all_staff">All Staff</option>
          <option value="managers">Managers Only</option>
          <option value="hr_only">HR Only</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            onFilterChangeResetPage();
          }}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
          <button
            onClick={() => setViewMode("cards")}
            title="Cards Grid"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            title="Table View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-table-line" />
          </button>
        </div>
      </div>
    </div>
  );
});
