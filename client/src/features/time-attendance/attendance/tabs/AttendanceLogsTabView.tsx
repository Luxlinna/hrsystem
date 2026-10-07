import { memo } from "react";
import type { AttendanceRecord, Employee, WorkLocation } from "../types";
import type { Holiday } from "@/services/holidays/holidaysService";



import { AttendanceControlBar } from "../components/AttendanceControlBar";
import { RecordsTab } from "./RecordsTab";

interface Props {
  myEmployee: Employee | null;
  myTodayRecord: AttendanceRecord | null;
  todayHoliday?: Holiday | null;
  metrics: any;
  filters: any;
  employees: Employee[];
  workLocations: WorkLocation[];
  branches?: { id: string; name: string }[];
  departments?: string[];
  positions?: string[];
  employeeTypes?: string[];
  employeeLevels?: string[];
  todayYMD: string;
  canManage: boolean;
  isFourPunchMode: boolean;
  holidays: any;
  shifts: any[];
  totalRecordsCount: number;
  onSelectRecord: (r: AttendanceRecord | null) => void;
  onEditRecord: (r: AttendanceRecord | null) => void;
  onDeleteRecord: (id: number) => void;
  onOpenTimeLog: (empId?: string) => void;
}

export const AttendanceLogsTabView = memo(function AttendanceLogsTabView({
  myEmployee,
  myTodayRecord,
  todayHoliday,
  metrics,
  filters,
  employees,
  workLocations,
  branches = [],
  departments,
  positions,
  employeeTypes,
  employeeLevels,
  todayYMD,
  canManage,
  isFourPunchMode,
  holidays,
  shifts,
  totalRecordsCount,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onOpenTimeLog,
}: Props) {
  return (
    <>



      <AttendanceControlBar
        canManage={canManage}
        filteredRecordsCount={filters.filteredRecords.length}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        filterDatePreset={filters.filterDatePreset}
        setFilterDatePreset={filters.setFilterDatePreset}
        singleDate={filters.singleDate}
        setSingleDate={filters.setSingleDate}
        fromDate={filters.fromDate}
        setFromDate={filters.setFromDate}
        toDate={filters.toDate}
        setToDate={filters.setToDate}
        departments={departments && departments.length > 0 ? departments : filters.departments}
        filterDepartment={filters.filterDepartment}
        setFilterDepartment={filters.setFilterDepartment}
        roles={positions && positions.length > 0 ? positions : filters.roles}
        filterRole={filters.filterRole}
        setFilterRole={filters.setFilterRole}
        employmentTypes={employeeTypes && employeeTypes.length > 0 ? employeeTypes : filters.employmentTypes}
        filterEmploymentType={filters.filterEmploymentType}
        setFilterEmploymentType={filters.setFilterEmploymentType}
        employeeLevels={employeeLevels || []}
        filterEmployeeLevel={filters.filterEmployeeLevel}
        setFilterEmployeeLevel={filters.setFilterEmployeeLevel}
        filterStatus={filters.filterStatus}
        setFilterStatus={filters.setFilterStatus}
        workLocations={workLocations}
        branches={branches}
        filterBranch={filters.filterBranch}
        setFilterBranch={filters.setFilterBranch}
        filterWorkLocation={filters.filterWorkLocation}
        setFilterWorkLocation={filters.setFilterWorkLocation}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        todayYMD={todayYMD}
      />

      <RecordsTab
        filteredRecords={filters.filteredRecords}
        pagedRecords={filters.pagedRecords}
        viewMode={filters.viewMode}
        todayYMD={todayYMD}
        canManage={canManage}
        isFourPunchMode={isFourPunchMode}
        holidays={holidays}
        shifts={shifts}
        pageSize={filters.pageSize}
        setPageSize={filters.setPageSize}
        page={filters.page}
        setPage={filters.setPage}
        totalPages={filters.totalPages}
        onSelectRecord={onSelectRecord}
        onEditRecord={onEditRecord}
        onDeleteRecord={onDeleteRecord}
        onLogTimeForEmployee={onOpenTimeLog}
        totalRecordsCount={totalRecordsCount}
        onResetFilters={filters.handleResetFilters}
        isFiltered={filters.isFiltered}
      />
    </>
  );
});
