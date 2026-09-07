import { memo } from "react";
import type { OrgChartViewMode } from "../types";
import { DEPT_COLORS } from "../constants";

interface OrgChartFilterBarProps {
  searchTerm: string;
  setSearchTerm: (q: string) => void;
  deptFilter: string;
  setDeptFilter: (d: string) => void;
  departments: string[];
  viewMode: OrgChartViewMode;
}

export const OrgChartFilterBar = memo(function OrgChartFilterBar({
  searchTerm,
  setSearchTerm,
  deptFilter,
  setDeptFilter,
  departments,
  viewMode,
}: OrgChartFilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-3 mb-6 transition-colors">
      {/* Search Input & Department Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm" />
          <input
            type="text"
            placeholder="Search employee by name, job role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D] dark:focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D] dark:focus:ring-blue-500 cursor-pointer"
          >
            <option value="" className="dark:bg-slate-800">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d} className="dark:bg-slate-800">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Department Legend Chips */}
      {viewMode === "tree" && departments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-gray-400 dark:text-slate-400 mr-1">Departments:</span>
          {departments.map((d) => {
            const isSelected = deptFilter === d;
            return (
              <button
                key={d}
                onClick={() => setDeptFilter(isSelected ? "" : d)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#253C7D] dark:bg-blue-600 text-white shadow-2xs"
                    : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/60 dark:border-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${DEPT_COLORS[d] || "bg-gray-400"}`}
                />
                <span>{d}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
