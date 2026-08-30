import { memo } from "react";

interface AssignStaffFiltersBarProps {
  assignSearch: string;
  setAssignSearch: (q: string) => void;
  assignDeptFilter: string;
  setAssignDeptFilter: (d: string) => void;
  departments: string[];
  totalEmployees: number;
}

export const AssignStaffFiltersBar = memo(function AssignStaffFiltersBar({
  assignSearch,
  setAssignSearch,
  assignDeptFilter,
  setAssignDeptFilter,
  departments,
  totalEmployees,
}: AssignStaffFiltersBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={assignSearch}
          onChange={(e) => setAssignSearch(e.target.value)}
          placeholder="Search employee by name, department, or role..."
          className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#253C7D] transition-colors"
        />
        {assignSearch && (
          <button
            type="button"
            onClick={() => setAssignSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>
      <select
        value={assignDeptFilter}
        onChange={(e) => setAssignDeptFilter(e.target.value)}
        className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer shrink-0"
      >
        <option value="all">All Departments ({totalEmployees})</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
});
