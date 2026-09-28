import { memo } from "react";
import type { AttendanceRecord, Employee, WorkLocation } from "../types";
import type { Holiday } from "@/services/holidays/holidaysService";
import { SelfCheckInBanner } from "../components/SelfCheckInBanner";
import { AttendanceKpiBar } from "../components/AttendanceKpiBar";
import { AttendanceWorkSitePills } from "../components/AttendanceWorkSitePills";
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
      <SelfCheckInBanner
        myEmployee={myEmployee}
        myTodayRecord={myTodayRecord}
        todayHoliday={todayHoliday}
      />

      <AttendanceKpiBar
        filterDatePreset={filters.filterDatePreset}
        filterStatus={filters.filterStatus}
        setFilterStatus={filters.setFilterStatus}
        presentCount={metrics.presentCount}
        workingNow={metrics.workingNow}
        lateCount={metrics.lateCount}
        remoteCount={metrics.remoteCount}
        absentCount={metrics.absentCount}
      />

      {canManage && (
        <AttendanceWorkSitePills
          todayByWorkSite={metrics.todayByWorkSite}
          filterWorkLocation={filters.filterWorkLocation}
          setFilterWorkLocation={filters.setFilterWorkLocation}
        />
      )}

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
        departments={filters.departments}
        filterDepartment={filters.filterDepartment}
        setFilterDepartment={filters.setFilterDepartment}
        employees={employees}
        filterEmployeeId={filters.filterEmployeeId}
        setFilterEmployeeId={filters.setFilterEmployeeId}
        filterStatus={filters.filterStatus}
        setFilterStatus={filters.setFilterStatus}
        workLocations={workLocations}
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
