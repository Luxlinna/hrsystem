import { memo } from "react";
import { ModuleSelectorCard } from "./ModuleSelectorCard";
import { RecordStatusFilter } from "./RecordStatusFilter";
import { EmployeeFilterCard } from "./EmployeeFilterCard";
import { DateRangeFilterCard } from "./DateRangeFilterCard";

interface ReportsSidebarFiltersProps {
  activeModule: string;
  onSelectModule: (modId: string) => void;
  recordStatus: "all" | "active" | "deleted";
  setRecordStatus: (st: "all" | "active" | "deleted") => void;
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
  isDateScoped: boolean;
  dateFrom: string;
  setDateFrom: (d: string) => void;
  dateTo: string;
  setDateTo: (d: string) => void;
}

export const ReportsSidebarFilters = memo(function ReportsSidebarFilters({
  activeModule,
  onSelectModule,
  recordStatus,
  setRecordStatus,
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
  isDateScoped,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: ReportsSidebarFiltersProps) {
  const activeCount =
    (recordStatus !== "all" ? 1 : 0) +
    (employeeSearch ? 1 : 0) +
    (departmentFilter ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0);

  const handleResetAll = () => {
    setRecordStatus("all");
    setEmployeeSearch("");
    setDepartmentFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <aside className="lg:w-[290px] shrink-0">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs divide-y divide-slate-100 overflow-visible sticky top-6">
        {/* Panel Header */}
        <div className="px-4 py-3 bg-slate-50/70 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-equalizer-line text-[#253C7D] text-sm" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Report Controls
            </span>
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-semibold text-[#253C7D] hover:underline cursor-pointer"
            >
              Reset ({activeCount})
            </button>
          )}
        </div>

        {/* Module Selector Section */}
        <ModuleSelectorCard
          activeModule={activeModule}
          onSelectModule={onSelectModule}
        />

        {/* Record Status Filter Section */}
        <RecordStatusFilter
          recordStatus={recordStatus}
          setRecordStatus={setRecordStatus}
        />

        {/* Staff & Hierarchy Scope Section */}
        <EmployeeFilterCard
          isEmployeeScoped={isEmployeeScoped}
          isNameScoped={isNameScoped}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          departments={departments}
          branches={branches}
        />

        {/* Date Window Section */}
        <DateRangeFilterCard
          isDateScoped={isDateScoped}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />
      </div>
    </aside>
  );
});
