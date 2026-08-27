import { memo } from "react";
import { STAGES, SORT_OPTIONS } from "../constants";

interface OnboardingFilterBarProps {
  viewMode: "cards" | "kanban" | "table";
  setViewMode: (mode: "cards" | "kanban" | "table") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  stageFilter: string;
  setStageFilter: (s: string) => void;
  sortBy: "newest" | "name" | "progress" | "days";
  setSortBy: (s: "newest" | "name" | "progress" | "days") => void;
}

export const OnboardingFilterBar = memo(function OnboardingFilterBar({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  stageFilter,
  setStageFilter,
  sortBy,
  setSortBy,
}: OnboardingFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 mb-6">
      {/* View Switcher & Search Bar */}
      <div className="flex items-center gap-3 flex-1">
        {/* View Mode Buttons */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60 shrink-0">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Card View"
          >
            <i className="ri-layout-grid-line" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "kanban" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Kanban Board"
          >
            <i className="ri-kanban-view" />
            <span className="hidden sm:inline">Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-600"
            }`}
            title="Table View"
          >
            <i className="ri-table-line" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search new hires by name, role, department, branch..."
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
      </div>

      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Stage Filter */}
        {viewMode !== "kanban" && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "name" | "progress" | "days")}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
