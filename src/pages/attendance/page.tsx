import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAttendance } from "./hooks/useAttendance";
import { AttendanceHeader } from "./components/AttendanceHeader";
import { AttendanceModals } from "./components/AttendanceModals";
import { useScheduleTemplates } from "./components/schedule-templates/useScheduleTemplates";
import { useShiftsManager } from "./components/shifts-manager/useShiftsManager";
import { AttendanceTabsRouter } from "./components/AttendanceTabsRouter";
import { AttendanceFullViewOverlay } from "./components/AttendanceFullViewOverlay";
import { useAttendanceLogNavigation } from "./hooks/useAttendanceLogNavigation";

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const activeMainTab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours" =
    rawTab === "attendance-schedule" || rawTab === "schedule-templates" || rawTab === "shifts" || rawTab === "working-hours"
      ? rawTab
      : "attendance";

  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [timeLogInitialEmployeeId, setTimeLogInitialEmployeeId] = useState<string | undefined>(undefined);

  const scheduleTemplates = useScheduleTemplates();
  const shiftsManager = useShiftsManager();

  const {
    canManage, canViewAll,
    todayYMD, userBranchName, userBranchId, isFourPunchMode,
    selectedRecord, setSelectedRecord, editingRecord, setEditingRecord,
    showLogModal, setShowLogModal, newRecord, setNewRecord,
    myTodayRecord, data, filters, metrics, mutations,
    holidays, holidaysState,
    handleSaveNewRecord, handleUpdateRecord,
  } = useAttendance();

  const handleOpenTimeLog = useCallback((empId?: string) => {
    setTimeLogInitialEmployeeId(empId || (canViewAll ? undefined : data.myEmployee?.id));
    setShowTimeLogForm(true);
  }, [canViewAll, data.myEmployee?.id]);

  useEffect(() => {
    if (searchParams.get("action") === "new-log") handleOpenTimeLog();
  }, [searchParams, handleOpenTimeLog]);

  const handleTabChange = useCallback((tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "attendance") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      return next;
    });
  }, [setSearchParams]);

  const handleViewAttendanceLog = useAttendanceLogNavigation({
    handleTabChange,
    filters,
    data,
    shifts: shiftsManager.shifts,
  });

  const overlayView = (
    <AttendanceFullViewOverlay
      loading={data.loading}
      hasRecords={data.records.length > 0}
      isPartnerBranchBlocked={data.isPartnerBranchBlocked}
      currentTime={data.currentTime}
      activeTab={filters.activeTab}
      dateRangeBounds={filters.dateRangeBounds}
      userBranchName={userBranchName}
      userBranchId={userBranchId}
      showTimeLogForm={showTimeLogForm}
      onCloseTimeLog={() => {
        setShowTimeLogForm(false);
        setTimeLogInitialEmployeeId(undefined);
      }}
      employees={data.employees}
      workLocations={data.workLocations}
      timeLogInitialEmployeeId={timeLogInitialEmployeeId}
      canViewAll={canViewAll}
      myEmployee={data.myEmployee}
      onRefreshData={data.fetchData}
      scheduleTemplates={scheduleTemplates}
      shiftsManager={shiftsManager}
      selectedRecord={selectedRecord}
      onCloseRecordDetail={() => setSelectedRecord(null)}
      onEditRecord={(r) => setEditingRecord(r)}
      onDeleteRecord={mutations.handleDeleteRecord}
    />
  );

  if (data.loading && data.records.length === 0) return overlayView;
  if (data.isPartnerBranchBlocked) return overlayView;
  if (showTimeLogForm) return overlayView;
  if (scheduleTemplates.activeFormTemplate !== null) return overlayView;
  if (shiftsManager.activeFormShift !== null) return overlayView;
  if (selectedRecord !== null) return overlayView;

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <AttendanceHeader
        currentTime={data.currentTime}
        activeTab={filters.activeTab}
        dateRangeBounds={filters.dateRangeBounds}
        canViewAll={canViewAll}
        hasEmployee={!!data.myEmployee}
        onExportCSV={filters.handleExportCSV}
        onOpenLogModal={() => handleOpenTimeLog()}
        activeMainTab={activeMainTab}
        setActiveMainTab={handleTabChange}
        records={filters.filteredRecords.length > 0 ? filters.filteredRecords : data.records}
        summaries={metrics.employeeSummary || []}
        isFourPunchMode={isFourPunchMode}
        shifts={shiftsManager.shifts}
      />

      <AttendanceTabsRouter
        activeMainTab={activeMainTab}
        onTabChange={handleTabChange}
        scheduleTemplates={scheduleTemplates}
        shiftsManager={shiftsManager}
        onViewAttendanceLog={handleViewAttendanceLog}
        logsProps={{
          myEmployee: data.myEmployee,
          myTodayRecord,
          todayHoliday: holidaysState.todayHoliday,
          metrics,
          filters,
          employees: data.employees,
          workLocations: data.workLocations,
          branches: data.branches,
          departments: data.depts,
          positions: data.positions,
          employeeTypes: data.employeeTypes,
          employeeLevels: data.employeeLevels,
          todayYMD,
          canManage,
          isFourPunchMode,
          holidays,
          shifts: shiftsManager.shifts,
          totalRecordsCount: data.records.length,
          onSelectRecord: setSelectedRecord,
          onEditRecord: setEditingRecord,
          onDeleteRecord: mutations.handleDeleteRecord,
          onOpenTimeLog: handleOpenTimeLog,
        }}
      />

      <AttendanceModals
        selectedRecord={selectedRecord}
        setSelectedRecord={setSelectedRecord}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        showLogModal={showLogModal}
        setShowLogModal={setShowLogModal}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        canManage={canManage}
        employees={data.employees}
        workLocations={data.workLocations}
        myEmployee={data.myEmployee}
        saving={mutations.saving}
        onSaveNewRecord={handleSaveNewRecord}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={mutations.handleDeleteRecord}
      />
    </div>
  );
}
