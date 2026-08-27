import { ModuleList } from "./sidebar/ModuleList";
import { RecordStatusFilter } from "./sidebar/RecordStatusFilter";
import { EmployeeFilters } from "./sidebar/EmployeeFilters";
import { DateRangeFilter } from "./sidebar/DateRangeFilter";

interface FilterSidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
  recordStatus: "all" | "active" | "deleted";
  setRecordStatus: (v: "all" | "active" | "deleted") => void;
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
  isDateScoped: boolean;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
}

export function FilterSidebar(props: FilterSidebarProps) {
  const {
    activeModule,
    setActiveModule,
    recordStatus,
    setRecordStatus,
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
    isDateScoped,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  } = props;

  return (
    <div className="lg:w-[280px] shrink-0 space-y-4">
      <ModuleList activeModule={activeModule} setActiveModule={setActiveModule} />
      <RecordStatusFilter recordStatus={recordStatus} setRecordStatus={setRecordStatus} />
      <EmployeeFilters
        employeeSearch={employeeSearch}
        setEmployeeSearch={setEmployeeSearch}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        departments={departments}
        branches={branches}
        isEmployeeScoped={isEmployeeScoped}
        isNameScoped={isNameScoped}
      />
      <DateRangeFilter
        isDateScoped={isDateScoped}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
      />
    </div>
  );
}
