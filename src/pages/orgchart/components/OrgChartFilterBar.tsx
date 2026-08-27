import { memo } from "react";
import { DEPT_COLORS } from "../constants";

interface OrgChartFilterBarProps {
  searchTerm: string;
  setSearchTerm: (q: string) => void;
  deptFilter: string;
  setDeptFilter: (d: string) => void;
  departments: string[];
  viewMode: "tree" | "list";
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
    <div className="space-y-4 mb-6">
      {/* Search Input & Department Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Department Legend Chips (for Tree View) */}
      {viewMode === "tree" && (
        <div className="flex flex-wrap gap-2 pt-1">
          {departments.map((d) => (
            <div key={d} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${DEPT_COLORS[d] || "bg-gray-400"}`} />
              <span className="text-[11px] text-gray-500">{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
