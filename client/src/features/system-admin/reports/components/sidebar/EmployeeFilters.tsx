interface EmployeeFiltersProps {
  employeeSearch: string;
  setEmployeeSearch: (v: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (v: string) => void;
  branchFilter: string;
  setBranchFilter: (v: string) => void;
  departments: string[];
  branches: string[];
  isEmployeeScoped: boolean;
  isNameScoped: boolean;
}

export function EmployeeFilters(props: EmployeeFiltersProps) {
  const {
    employeeSearch,
    setEmployeeSearch,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    departments,
    branches,
    isEmployeeScoped,
    isNameScoped,
  } = props;

  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 ${!isEmployeeScoped ? "opacity-40 pointer-events-none" : ""}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Employee Filters {!isEmployeeScoped && <span className="normal-case font-normal">(not used by this report)</span>}
      </p>
      <div className="space-y-3">
        <div className={!isNameScoped ? "opacity-40 pointer-events-none" : ""}>
          <label className="text-xs text-gray-500 mb-1 block">
            Name {!isNameScoped && isEmployeeScoped && <span className="normal-case font-normal">(not used by this report)</span>}
          </label>
          <input
            type="text"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder="Search employee name..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Department</label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Branch / Team</label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {(employeeSearch || departmentFilter || branchFilter) && (
          <button
            onClick={() => { setEmployeeSearch(""); setDepartmentFilter(""); setBranchFilter(""); }}
            className="text-xs text-[#253C7D] hover:underline cursor-pointer w-full text-center"
          >
            Clear employee filters
          </button>
        )}
      </div>
    </div>
  );
}
