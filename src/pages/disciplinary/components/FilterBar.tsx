import { memo } from "react";
import type { ViewMode } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from "../constants";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterSeverity: string;
  setFilterSeverity: (sev: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterScope: "all" | "admin" | "branch";
  setFilterScope: (s: "all" | "admin" | "branch") => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSuperAdmin: boolean;
}

export const FilterBar = memo(function FilterBar({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterSeverity,
  setFilterSeverity,
  filterStatus,
  setFilterStatus,
  filterScope,
  setFilterScope,
  viewMode,
  setViewMode,
  isSuperAdmin,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search cases by employee name, title, department, or keywords..."
          className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Scope Filter for SuperAdmin */}
        {isSuperAdmin && (
          <select
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value as "all" | "admin" | "branch")}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
          >
            <option value="all">🌐 All Scopes</option>
            <option value="admin">🌐 Company-Wide (Admin)</option>
            <option value="branch">🏢 Branch Only</option>
          </select>
        )}

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
        >
          <option value="">All Incident Types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
        >
          <option value="">All Severities</option>
          {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            title="Cards View"
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
          <button
            type="button"
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
