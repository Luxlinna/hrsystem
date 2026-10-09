import React from "react";
import { MovementsExportMenu } from "./MovementsExportMenu";
import { MovementsDateRangeFilter } from "./filters/MovementsDateRangeFilter";
import { EmployeesContractTypeFilter } from "@/features/workforce/employees/components/EmployeesContractTypeFilter";
import { EmployeesJobStatusFilter } from "@/features/workforce/employees/components/EmployeesJobStatusFilter";
import { EmployeesFilterDropdown } from "@/features/workforce/employees/components/EmployeesFilterDropdown";
import type { EmployeeMovement } from "../types";
import type { Branch } from "@/features/workforce/employees/types";

interface MovementsFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedStatus?: string;
  onStatusChange?: (val: string) => void;
  showSalary?: boolean;
  onToggleSalary?: () => void;
  onOpenImport?: () => void;
  movements?: EmployeeMovement[];
  filterDateOption?: string;
  onDateOptionChange?: (val: string) => void;
  filterContractType?: string[];
  onContractTypeChange?: (val: string[]) => void;
  filterJobStatus?: string[];
  onJobStatusChange?: (val: string[]) => void;
  contractTypes?: string[];
  jobStatuses?: string[];
  filterBranch?: string;
  onBranchChange?: (val: string) => void;
  filterWorkLocation?: string;
  onWorkLocationChange?: (val: string) => void;
  filterDivision?: string;
  onDivisionChange?: (val: string) => void;
  filterDept?: string;
  onDeptChange?: (val: string) => void;
  filterRole?: string;
  onRoleChange?: (val: string) => void;
  filterEmployeeType?: string;
  onEmployeeTypeChange?: (val: string) => void;
  filterEmployeeLevel?: string;
  onEmployeeLevelChange?: (val: string) => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  isDeleting?: boolean;
  branches?: Branch[];
  workSites?: { id: string; name: string; branch_id: string }[];
  divisions?: string[];
  depts?: string[];
  positions?: string[];
  employeeTypes?: string[];
  employeeLevels?: string[];
}

export const MovementsFilterBar: React.FC<MovementsFilterBarProps> = (props) => {
  const {
    search, onSearchChange, selectedStatus = "", onStatusChange,
    showSalary = false, onToggleSalary, onOpenImport, movements = [],
    filterDateOption = "all", onDateOptionChange = () => {},
    filterContractType = [], onContractTypeChange = () => {},
    filterJobStatus = [], onJobStatusChange = () => {},
    contractTypes = [], jobStatuses = [], filterBranch = "",
    onBranchChange = () => {}, filterWorkLocation = "all",
    onWorkLocationChange = () => {}, filterDivision = "",
    onDivisionChange = () => {}, filterDept = "", onDeptChange = () => {},
    filterRole = "", onRoleChange = () => {}, filterEmployeeType = "",
    onEmployeeTypeChange = () => {}, filterEmployeeLevel = "",
    onEmployeeLevelChange = () => {}, branches = [], workSites = [],
    divisions = [], depts = [], positions = [], employeeTypes = [], employeeLevels = [],
    selectedCount = 0, onBulkDelete, isDeleting = false,
  } = props;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 pb-3 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex rounded-sm overflow-hidden border border-slate-300 bg-white w-64 md:w-80 shadow-2xs focus-within:border-[#253C7D] h-8">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
          />
          <button type="button" className="px-3 bg-[#253C7D] hover:bg-[#1E3066] text-white flex items-center justify-center cursor-pointer">
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedCount > 0 && onBulkDelete && (
            <button
              type="button"
              onClick={onBulkDelete}
              disabled={isDeleting}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Delete selected records"
            >
              <i className="ri-delete-bin-line text-xs" />
              <span>{isDeleting ? "Deleting..." : `Delete (${selectedCount})`}</span>
            </button>
          )}

          <button type="button" onClick={onOpenImport} className="w-7 h-7 rounded border border-slate-300 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center text-sm cursor-pointer" title="Import Data">
            <i className="ri-download-2-line text-xs text-[#253C7D]" />
          </button>

          <MovementsExportMenu movements={movements} />
          <MovementsDateRangeFilter selectedOption={filterDateOption} onApplyDateFilter={onDateOptionChange} />
          <EmployeesContractTypeFilter selectedContracts={filterContractType} contractTypes={contractTypes} onApplyContractFilter={onContractTypeChange} />
          <EmployeesJobStatusFilter selectedJobStatuses={filterJobStatus} jobStatuses={jobStatuses} onApplyJobStatusFilter={onJobStatusChange} />

          {onToggleSalary && (
            <button
              type="button"
              onClick={onToggleSalary}
              className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer ${
                showSalary ? "border-[#253C7D] bg-[#253C7D] text-white" : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
              }`}
            >
              <span>{showSalary ? "Hide Salary" : "Show Salary"}</span>
            </button>
          )}

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="appearance-none px-3 py-1 pr-6 rounded-full border border-[#253C7D]/40 text-xs text-[#253C7D] bg-white hover:bg-[#253C7D]/5 focus:outline-none cursor-pointer"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="recorded">Recorded</option>
              <option value="onboarding">Onboarding</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <i className="ri-arrow-down-s-line text-[#253C7D]/50 text-xs absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <EmployeesFilterDropdown
            filterBranch={filterBranch}
            setFilterBranch={onBranchChange}
            filterWorkLocation={filterWorkLocation}
            setFilterWorkLocation={onWorkLocationChange}
            filterDivision={filterDivision}
            setFilterDivision={onDivisionChange}
            filterDept={filterDept}
            setFilterDept={onDeptChange}
            filterRole={filterRole}
            setFilterRole={onRoleChange}
            filterEmployeeType={filterEmployeeType}
            setFilterEmployeeType={onEmployeeTypeChange}
            filterEmployeeLevel={filterEmployeeLevel}
            setFilterEmployeeLevel={onEmployeeLevelChange}
            branches={branches}
            workSites={workSites}
            divisions={divisions}
            depts={depts}
            positions={positions}
            employeeTypes={employeeTypes}
            employeeLevels={employeeLevels}
          />
        </div>
      </div>
    </div>
  );
};
