import { memo } from "react";
import type { Branch, VisibleColumns, ViewMode, Employee, AccountStatus } from "../types";
import { EmployeesExportMenu } from "./EmployeesExportMenu";
import { EmployeesAllDateFilter } from "./EmployeesAllDateFilter";
import { EmployeesContractTypeFilter } from "./EmployeesContractTypeFilter";
import { EmployeesJobStatusFilter } from "./EmployeesJobStatusFilter";
import { EmployeesFilterDropdown } from "./EmployeesFilterDropdown";
import { EmployeesAdvancedFilters } from "./EmployeesAdvancedFilters";

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
  filterJobStatus?: string[];
  setFilterJobStatus?: (statuses: string[]) => void;
  filterRole?: string;
  setFilterRole?: (role: string) => void;
  filterEmployeeType?: string;
  setFilterEmployeeType?: (type: string) => void;
  filterEmployeeLevel?: string;
  setFilterEmployeeLevel?: (level: string) => void;
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
  filterAccount: string;
  setFilterAccount: (acc: string) => void;
  filterDateOption?: string;
  setFilterDateOption?: (opt: string) => void;
  filterContractType?: string[];
  setFilterContractType?: (types: string[]) => void;
  contractTypes?: string[];
  jobStatuses?: string[];
  positions?: string[];
  employeeTypes?: string[];
  employeeLevels?: string[];
  depts: (string | null | undefined)[];
  branches: Branch[];
  workSites?: { id: string; name: string; branch_id: string }[];
  visibleColumns: VisibleColumns;
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumns>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  employees?: Employee[];
  accountStatus?: Record<string, AccountStatus>;
  onExportCSV?: () => void;
  showSalary?: boolean;
  setShowSalary?: (show: boolean) => void;
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
  filterJobStatus = [],
  setFilterJobStatus,
  filterRole = "",
  setFilterRole = () => {},
  filterEmployeeType = "",
  setFilterEmployeeType = () => {},
  filterEmployeeLevel = "",
  setFilterEmployeeLevel = () => {},
  filterBranch,
  setFilterBranch,
  filterAccount,
  setFilterAccount,
  filterDateOption = "all",
  setFilterDateOption,
  filterContractType = [],
  setFilterContractType,
  contractTypes,
  jobStatuses,
  positions = [],
  employeeTypes,
  employeeLevels,
  depts,
  branches,
  workSites = [],
  visibleColumns,
  setVisibleColumns,
  employees = [],
  accountStatus = {},
  showSalary = false,
  setShowSalary,
}: EmployeesFilterBarProps) {
  return (
    <div className="bg-white rounded-none border-b border-slate-200/80 pb-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Search Box with attached blue search button */}
        <div className="flex rounded-sm overflow-hidden border border-slate-300 bg-white w-64 md:w-80 shadow-2xs focus-within:border-[#253C7D] h-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
          />
          <button
            type="button"
            className="px-3 bg-[#253C7D] hover:bg-[#1E3066] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Right: Action Pills & Dropdowns matching ERP screenshot */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Bulk Action Button */}
          <button
            type="button"
            className="px-3 py-1 rounded-full border border-slate-300 text-xs font-medium text-slate-500 bg-white hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
          >
            <span>Bulk Action</span>
            <i className="ri-arrow-down-s-line text-xs text-slate-400" />
          </button>

          {/* Import Button */}
          <button
            type="button"
            className="w-7 h-7 rounded border border-slate-300 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center text-sm cursor-pointer"
            title="Import Data"
          >
            <i className="ri-download-2-line text-xs text-[#253C7D]" />
          </button>

          {/* Export Button */}
          <EmployeesExportMenu employees={employees} accountStatus={accountStatus} />

          {/* All Date Pill with Popover matching screenshot */}
          <EmployeesAllDateFilter
            selectedOption={filterDateOption}
            onApplyDateFilter={setFilterDateOption}
          />

          {/* Contract Type Pill Popover with live BU contract types */}
          <EmployeesContractTypeFilter
            selectedContracts={filterContractType}
            contractTypes={contractTypes}
            onApplyContractFilter={setFilterContractType}
          />

          {/* Job Status Pill Popover with live BU Job Statuses */}
          <EmployeesJobStatusFilter
            selectedJobStatuses={filterJobStatus}
            jobStatuses={jobStatuses}
            onApplyJobStatusFilter={setFilterJobStatus}
          />

          {/* Show Salary Toggle */}
          {setShowSalary && (
            <button
              type="button"
              onClick={() => setShowSalary(!showSalary)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                showSalary
                  ? "border-[#253C7D] bg-[#253C7D] text-white"
                  : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
              }`}
            >
              <span>{showSalary ? "Hide Salary" : "Show Salary"}</span>
            </button>
          )}

          {/* Status Pill */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none px-3 py-1 pr-6 rounded-full border border-[#253C7D]/40 text-xs text-[#253C7D] bg-white hover:bg-[#253C7D]/5 focus:outline-none cursor-pointer"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <i className="ri-arrow-down-s-line text-[#253C7D]/50 text-xs absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Hierarchical Filter Flyout Dropdown matching Screenshot */}
          <EmployeesFilterDropdown
            filterBranch={filterBranch}
            setFilterBranch={setFilterBranch}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            filterEmployeeType={filterEmployeeType}
            setFilterEmployeeType={setFilterEmployeeType}
            filterEmployeeLevel={filterEmployeeLevel}
            setFilterEmployeeLevel={setFilterEmployeeLevel}
            branches={branches}
            workSites={workSites}
            depts={depts}
            positions={positions}
            employeeTypes={employeeTypes}
            employeeLevels={employeeLevels}
          />
        </div>
      </div>

      {/* Advanced Filter and Column customizer panel */}
      <EmployeesAdvancedFilters
        showFilters={showFilters}
        showColumnMenu={showColumnMenu}
        setShowColumnMenu={setShowColumnMenu}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterAccount={filterAccount}
        setFilterAccount={setFilterAccount}
        branches={branches}
        workSites={workSites}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />
    </div>
  );
});
