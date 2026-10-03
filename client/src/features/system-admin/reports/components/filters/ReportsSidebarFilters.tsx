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
  return (
    <div className="lg:w-[280px] shrink-0 space-y-4">
      {/* Module Selector */}
      <ModuleSelectorCard
        activeModule={activeModule}
        onSelectModule={onSelectModule}
      />

      {/* Record Status Filter */}
      <RecordStatusFilter
        recordStatus={recordStatus}
        setRecordStatus={setRecordStatus}
      />

      {/* Employee / Department / Branch Filters */}
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

      {/* Date Range Filters */}
      <DateRangeFilterCard
        isDateScoped={isDateScoped}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
      />
    </div>
  );
});
