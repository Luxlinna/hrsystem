import { memo } from "react";

interface EmployeeFilterCardProps {
  isEmployeeScoped: boolean;
  isNameScoped: boolean;
  employeeSearch: string;
  setEmployeeSearch: (name: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (dept: string) => void;
  branchFilter: string;
  setBranchFilter: (branch: string) => void;
  departments: string[];
  branches: string[];
}

export const EmployeeFilterCard = memo(function EmployeeFilterCard({
  isEmployeeScoped,
  isNameScoped,
  employeeSearch,
  setEmployeeSearch,
  departmentFilter,
  setDepartmentFilter,
  branchFilter,
  setBranchFilter,
  departments,
  branches,
}: EmployeeFilterCardProps) {
  if (!isEmployeeScoped) {
    return (
      <div className="p-4 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <i className="ri-information-line text-slate-400 text-sm" />
          <span>No employee filters for this report</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Staff &amp; Hierarchy
        </label>
        {(employeeSearch || departmentFilter || branchFilter) && (
          <button
            onClick={() => {
              setEmployeeSearch("");
              setDepartmentFilter("");
              setBranchFilter("");
            }}
            className="text-[11px] text-[#253C7D] font-medium hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Employee Search */}
      {isNameScoped && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Employee Name
          </label>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Filter by name..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:bg-white transition-colors"
            />
            {employeeSearch && (
              <button
                type="button"
                onClick={() => setEmployeeSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Department Filter */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">
          Department
        </label>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:bg-white cursor-pointer transition-colors"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Branch Filter */}
      {branches.length > 1 && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">
            Branch / Location
          </label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:bg-white cursor-pointer transition-colors"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
