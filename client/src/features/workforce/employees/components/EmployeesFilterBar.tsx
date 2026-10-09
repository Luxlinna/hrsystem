import { memo } from "react";
import type { EmployeesFilterBarProps } from "./filter/filterBarTypes";
import { EmployeesExportMenu } from "./EmployeesExportMenu";
import { EmployeesAllDateFilter } from "./EmployeesAllDateFilter";
import { EmployeesContractTypeFilter } from "./EmployeesContractTypeFilter";
import { EmployeesJobStatusFilter } from "./EmployeesJobStatusFilter";
import { EmployeesFilterDropdown } from "./EmployeesFilterDropdown";
import { EmployeesAdvancedFilters } from "./EmployeesAdvancedFilters";

export const EmployeesFilterBar = memo(function EmployeesFilterBar({
  search, setSearch, showFilters, setShowFilters, showColumnMenu, setShowColumnMenu,
  filterDivision = "", setFilterDivision = () => {}, filterDept, setFilterDept,
  filterStatus, setFilterStatus, filterJobStatus = [], setFilterJobStatus,
  filterRole = "", setFilterRole = () => {}, filterEmployeeType = "", setFilterEmployeeType = () => {},
  filterEmployeeLevel = "", setFilterEmployeeLevel = () => {}, filterBranch, setFilterBranch,
  filterWorkLocation = "all", setFilterWorkLocation = () => {}, filterAccount, setFilterAccount,
  filterDateOption = "all", setFilterDateOption, filterContractType = [], setFilterContractType,
  contractTypes, jobStatuses, positions = [], employeeTypes, employeeLevels,
  divisions = [], depts, branches, workSites = [], visibleColumns, setVisibleColumns,
  employees = [], accountStatus = {}, onOpenImport, showSalary = false, setShowSalary,
}: EmployeesFilterBarProps) {
  const isFiltered = Boolean(filterStatus || search || (filterContractType && filterContractType.length > 0) || (filterJobStatus && filterJobStatus.length > 0) || (filterDateOption && filterDateOption !== "all"));

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
          <button type="button" className="px-3 bg-[#253C7D] hover:bg-[#1E3066] text-white flex items-center justify-center transition-colors cursor-pointer">
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Right: Action Pills & Dropdowns matching ERP screenshot */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" className="px-3 py-1 rounded-full border border-slate-300 text-xs font-medium text-slate-500 bg-white hover:bg-slate-50 flex items-center gap-1 cursor-pointer">
            <span>Bulk Action</span>
            <i className="ri-arrow-down-s-line text-xs text-slate-400" />
          </button>

          <button type="button" onClick={onOpenImport} className="w-7 h-7 rounded border border-slate-300 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center text-sm cursor-pointer transition-colors" title="Import Data">
            <i className="ri-download-2-line text-xs text-[#253C7D]" />
          </button>

          <EmployeesExportMenu employees={employees} accountStatus={accountStatus} />
          <EmployeesAllDateFilter selectedOption={filterDateOption} onApplyDateFilter={setFilterDateOption} />
          <EmployeesContractTypeFilter selectedContracts={filterContractType} contractTypes={contractTypes} onApplyContractFilter={setFilterContractType} />
          <EmployeesJobStatusFilter selectedJobStatuses={filterJobStatus} jobStatuses={jobStatuses} onApplyJobStatusFilter={setFilterJobStatus} />

          {setShowSalary && (
            <button
              type="button"
              onClick={() => setShowSalary(!showSalary)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                showSalary ? "border-[#253C7D] bg-[#253C7D] text-white" : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
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
              className={`appearance-none px-3 py-1 pr-6 rounded-full border text-xs bg-white hover:bg-[#253C7D]/5 focus:outline-none cursor-pointer transition-colors ${
                filterStatus ? "border-sky-600 text-sky-700 font-semibold bg-sky-50/60" : "border-[#253C7D]/40 text-[#253C7D]"
              }`}
            >
              <option value="">Status (All)</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <i className="ri-arrow-down-s-line text-[#253C7D]/50 text-xs absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters when Status or other filter is applied */}
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus("");
                setSearch("");
                setFilterContractType([]);
                setFilterJobStatus([]);
                setFilterDateOption("all");
              }}
              title="Reset All Filters to view all employees"
              className="px-2.5 py-1 rounded-full border border-rose-300 text-xs font-semibold text-rose-600 bg-rose-50/60 hover:bg-rose-100 flex items-center gap-1 cursor-pointer transition-all animate-in fade-in"
            >
              <i className="ri-refresh-line text-xs" />
              <span>Reset</span>
            </button>
          )}

          <EmployeesFilterDropdown
            filterBranch={filterBranch} setFilterBranch={setFilterBranch}
            filterWorkLocation={filterWorkLocation} setFilterWorkLocation={setFilterWorkLocation}
            filterDivision={filterDivision} setFilterDivision={setFilterDivision}
            filterDept={filterDept} setFilterDept={setFilterDept}
            filterRole={filterRole} setFilterRole={setFilterRole}
            filterEmployeeType={filterEmployeeType} setFilterEmployeeType={setFilterEmployeeType}
            filterEmployeeLevel={filterEmployeeLevel} setFilterEmployeeLevel={setFilterEmployeeLevel}
            branches={branches} workSites={workSites} divisions={divisions}
            depts={depts} positions={positions} employeeTypes={employeeTypes} employeeLevels={employeeLevels}
          />
        </div>
      </div>

      <EmployeesAdvancedFilters
        showFilters={showFilters} showColumnMenu={showColumnMenu} setShowColumnMenu={setShowColumnMenu}
        filterBranch={filterBranch} setFilterBranch={setFilterBranch}
        filterAccount={filterAccount} setFilterAccount={setFilterAccount}
        branches={branches} workSites={workSites} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns}
      />
    </div>
  );
});
