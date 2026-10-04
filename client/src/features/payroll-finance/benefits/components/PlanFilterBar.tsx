import { memo } from "react";
import { PLAN_TYPE_CONFIG } from "../constants";

interface PlanFilterBarProps {
  planSearchQuery: string;
  setPlanSearchQuery: (q: string) => void;
  planTypeFilter: string;
  setPlanTypeFilter: (t: string) => void;
  planStatusFilter: string;
  setPlanStatusFilter: (s: string) => void;
}

export const PlanFilterBar = memo(function PlanFilterBar({
  planSearchQuery,
  setPlanSearchQuery,
  planTypeFilter,
  setPlanTypeFilter,
  planStatusFilter,
  setPlanStatusFilter,
}: PlanFilterBarProps) {
  const isFiltered = planSearchQuery || planTypeFilter !== "all" || planStatusFilter !== "all";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      <div className="relative w-full sm:w-64">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={planSearchQuery}
          onChange={(e) => setPlanSearchQuery(e.target.value)}
          placeholder="Search plan name, provider..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {planSearchQuery && (
          <button
            type="button"
            onClick={() => setPlanSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={planTypeFilter}
          onChange={(e) => setPlanTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
        >
          <option value="all">All Benefit Types</option>
          {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
            <option key={t} value={t}>
              {PLAN_TYPE_CONFIG[t].label}
            </option>
          ))}
        </select>

        <select
          value={planStatusFilter}
          onChange={(e) => setPlanStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Plans</option>
          <option value="inactive">Inactive</option>
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setPlanSearchQuery("");
              setPlanTypeFilter("all");
              setPlanStatusFilter("all");
            }}
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
