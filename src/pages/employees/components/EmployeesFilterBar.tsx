import { memo } from "react";
import type { Branch, VisibleColumns, ViewMode } from "../types";

interface EmployeesFilterBarProps {
  search: string;
  setSearch: (search: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  showColumnMenu: boolean;
  setShowColumnMenu: (show: boolean) => void;
  filterDept: string;
  setFilterDept: (dept: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
  filterAccount: string;
  setFilterAccount: (acc: string) => void;
  depts: (string | null | undefined)[];
  branches: Branch[];
  visibleColumns: VisibleColumns;
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumns>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportCSV: () => void;
}

export const EmployeesFilterBar = memo(function EmployeesFilterBar({
  search,
  setSearch,
  showFilters,
  setShowFilters,
  showColumnMenu,
  setShowColumnMenu,
  filterDept,
  setFilterDept,
  filterStatus,
  setFilterStatus,
  filterBranch,
  setFilterBranch,
  filterAccount,
  setFilterAccount,
  depts,
  branches,
  visibleColumns,
  setVisibleColumns,
  viewMode,
  setViewMode,
  onExportCSV,
}: EmployeesFilterBarProps) {
  const hasActiveFilters = Boolean(filterDept || filterStatus || filterBranch || filterAccount);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search employees by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              showFilters ? "bg-[#253C7D]/10 text-[#1E3066]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <i className="ri-filter-3-line text-lg" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-[#253C7D] rounded-full" />}
          </button>
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
          >
            <i className="ri-layout-column-line text-lg" />
            Columns
          </button>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              <i className="ri-table-line text-lg" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              <i className="ri-grid-line text-lg" />
            </button>
          </div>
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
          >
            <i className="ri-download-line text-lg" />
            Export
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
          >
            <option value="">All Departments</option>
            {depts.map((d) => (
              <option key={d} value={d || ""}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="onboarding">Onboarding</option>
            <option value="on_leave">On Leave</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent cursor-pointer"
          >
            <option value="">All Account Statuses</option>
            <option value="has_account">Has Account</option>
            <option value="invited">Invited</option>
            <option value="no_account">No Account</option>
          </select>
        </div>
      )}

      {/* Column Menu */}
      {showColumnMenu && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-3">
            {Object.entries(visibleColumns).map(([key, visible]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
                />
                <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
