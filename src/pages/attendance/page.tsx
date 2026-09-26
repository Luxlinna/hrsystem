import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAttendance } from "./hooks/useAttendance";
import { useAttendanceOvertime } from "./hooks/useAttendanceOvertime";
import { AttendanceHeader } from "./components/AttendanceHeader";
import { SelfCheckInBanner } from "./components/SelfCheckInBanner";
import { AttendanceKpiBar } from "./components/AttendanceKpiBar";
import { AttendanceWorkSitePills } from "./components/AttendanceWorkSitePills";
import { AttendanceControlBar } from "./components/AttendanceControlBar";
import { CreateTimeLogForm } from "./components/CreateTimeLogForm";
import { CreateOvertimeForm } from "./components/overtime/CreateOvertimeForm";
import { OvertimeTab } from "./tabs/OvertimeTab";
import { RecordsTab } from "./tabs/RecordsTab";
import { AttendanceModals } from "./components/AttendanceModals";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useScheduleTemplates } from "./components/schedule-templates/useScheduleTemplates";
import { ScheduleTemplatesView } from "./components/schedule-templates/ScheduleTemplatesView";
import { CreateScheduleTemplateForm } from "./components/schedule-templates/CreateScheduleTemplateForm";
import { useShiftsManager } from "./components/shifts-manager/useShiftsManager";
import { ShiftsListView } from "./components/shifts-manager/ShiftsListView";
import { CreateShiftManagerForm } from "./components/shifts-manager/CreateShiftManagerForm";

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") as "attendance" | "schedule-templates" | "shifts" | "overtime" | null;
  const [activeMainTab, setActiveMainTab] = useState<"attendance" | "schedule-templates" | "shifts" | "overtime">(
    urlTab || "attendance"
  );

  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [timeLogInitialEmployeeId, setTimeLogInitialEmployeeId] = useState<string | undefined>(undefined);

  const scheduleTemplates = useScheduleTemplates();
  const shiftsManager = useShiftsManager();

  const {
    canManage, canViewAll, canAccessOvertime, canManageOvertimeSettings,
    todayYMD, userBranchName, userBranchId, isFourPunchMode,
    selectedRecord, setSelectedRecord, editingRecord, setEditingRecord,
    showLogModal, setShowLogModal, newRecord, setNewRecord,
    myTodayRecord, data, filters, metrics, mutations,
    holidays, holidaysState,
    handleSaveNewRecord, handleUpdateRecord,
  } = useAttendance();

  const overtime = useAttendanceOvertime({
    targetBranch: data.targetBranch,
    myEmployeeId: data.myEmployee?.id,
    canViewAll,
    canAccessOvertime,
  });

  useEffect(() => {
    if (urlTab && urlTab !== activeMainTab) {
      setActiveMainTab(urlTab);
    }
  }, [urlTab]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new-log") {
      handleOpenTimeLog();
    } else if (action === "holidays") {
      holidaysState.setShowHolidaysModal(true);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "attendance" | "schedule-templates" | "shifts" | "overtime") => {
    setActiveMainTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "attendance") {
        next.delete("tab");
      } else {
        next.set("tab", tab);
      }
      return next;
    });
  };

  const handleOpenTimeLog = (empId?: string) => {
    setTimeLogInitialEmployeeId(empId || (canViewAll ? undefined : data.myEmployee?.id));
    setShowTimeLogForm(true);
  };

  if (data.loading && data.records.length === 0) {
    return (
      <div className="attendance-hub min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading attendance control center...</p>
      </div>
    );
  }

  if (data.isPartnerBranchBlocked) {
    return (
      <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <AttendanceHeader
          currentTime={data.currentTime}
          activeTab={filters.activeTab}
          dateRangeBounds={filters.dateRangeBounds}
          canViewAll={false}
          canAccessOvertime={false}
          hasEmployee={false}
          onExportCSV={() => {}}
          onOpenLogModal={() => {}}
        />
        <PartnerBranchPrivacyShield moduleName="Time & Attendance" userBranchName={userBranchName} hasNoBranch={!userBranchId} />
      </div>
    );
  }

  if (showTimeLogForm) {
    return (
      <CreateTimeLogForm
        onBack={() => {
          setShowTimeLogForm(false);
          setTimeLogInitialEmployeeId(undefined);
        }}
        employees={data.employees}
        workLocations={data.workLocations}
        initialEmployeeId={timeLogInitialEmployeeId}
        isEmployeeFixed={!canViewAll && !!data.myEmployee}
        onSaved={data.fetchData}
        activeBranchId={userBranchId || null}
      />
    );
  }

  if (scheduleTemplates.activeFormTemplate !== null) {
    return (
      <CreateScheduleTemplateForm
        initialData={typeof scheduleTemplates.activeFormTemplate === "object" ? scheduleTemplates.activeFormTemplate : null}
        employees={data.employees}
        workLocations={data.workLocations}
        shifts={shiftsManager.shifts}
        onBack={() => scheduleTemplates.setActiveFormTemplate(null)}
        onSave={scheduleTemplates.handleSaveTemplate}
      />
    );
  }

  if (shiftsManager.activeFormShift !== null) {
    return (
      <CreateShiftManagerForm
        initialData={typeof shiftsManager.activeFormShift === "object" ? shiftsManager.activeFormShift : null}
        onBack={() => shiftsManager.setActiveFormShift(null)}
        onSave={shiftsManager.handleSaveShift}
      />
    );
  }

  if (overtime.showOvertimeForm && canAccessOvertime) {
    const isSelf = overtime.formMode === "request";
    return (
      <CreateOvertimeForm
        onBack={() => overtime.setShowOvertimeForm(false)}
        employees={data.employees}
        initialEmployeeId={isSelf ? data.myEmployee?.id : canViewAll ? undefined : data.myEmployee?.id}
        isEmployeeFixed={isSelf || (!canViewAll && !!data.myEmployee)}
        formMode={overtime.formMode}
        onSaved={overtime.fetchOvertime}
        activeBranchId={userBranchId || null}
      />
    );
  }

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <AttendanceHeader
        currentTime={data.currentTime}
        activeTab={filters.activeTab}
        dateRangeBounds={filters.dateRangeBounds}
        canViewAll={canViewAll}
        canAccessOvertime={canAccessOvertime}
        canManageOvertimeSettings={canManageOvertimeSettings}
        hasEmployee={!!data.myEmployee}
        onExportCSV={filters.handleExportCSV}
        onOpenLogModal={() => handleOpenTimeLog()}
        onCreateNewOvertime={overtime.handleCreateNew}
        onCreateOvertimeRequest={overtime.handleCreateRequest}
        onCreateOvertimeRequestFor={overtime.handleCreateRequestFor}
        onOpenOvertimeSettings={overtime.handleOpenSettings}
        activeMainTab={activeMainTab}
        setActiveMainTab={handleTabChange}
        records={filters.filteredRecords.length > 0 ? filters.filteredRecords : data.records}
        summaries={metrics.employeeSummary || []}
        isFourPunchMode={isFourPunchMode}
      />

      {activeMainTab === "schedule-templates" ? (
        <ScheduleTemplatesView
          templates={scheduleTemplates.templates}
          onCreateNew={() => scheduleTemplates.setActiveFormTemplate("new")}
          onEdit={(t) => scheduleTemplates.setActiveFormTemplate(t)}
          onDelete={scheduleTemplates.handleDeleteTemplate}
          onToggleStatus={scheduleTemplates.handleToggleStatus}
          onDuplicate={scheduleTemplates.handleDuplicateTemplate}
          onNavigateToShifts={() => handleTabChange("shifts")}
          onNavigateToLateEarly={() => handleTabChange("shifts")}
        />
      ) : activeMainTab === "shifts" ? (
        <ShiftsListView
          shifts={shiftsManager.shifts}
          onCreateNew={() => shiftsManager.setActiveFormShift("new")}
          onEdit={(s) => shiftsManager.setActiveFormShift(s)}
          onDelete={shiftsManager.handleDeleteShift}
          onDuplicate={shiftsManager.handleDuplicateShift}
          onNavigateToScheduleTemplates={() => handleTabChange("schedule-templates")}
          onNavigateToLateEarly={() => {}}
        />
      ) : canAccessOvertime && activeMainTab === "overtime" ? (
        <OvertimeTab
          records={overtime.overtimeRecords}
          canManage={canManage}
          canManageSettings={canManageOvertimeSettings}
          onOpenCreate={overtime.handleCreateNew}
          onCreateNew={overtime.handleCreateNew}
          onCreateRequest={overtime.handleCreateRequest}
          onCreateRequestFor={overtime.handleCreateRequestFor}
          onOpenSettings={overtime.handleOpenSettings}
          onExport={overtime.handleExport}
          onApprove={overtime.handleApprove}
          onReject={overtime.handleReject}
          onDelete={overtime.handleDelete}
        />
      ) : (
        <>
          <SelfCheckInBanner
            myEmployee={data.myEmployee}
            myTodayRecord={myTodayRecord}
            todayHoliday={holidaysState.todayHoliday}
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
            employees={data.employees}
            filterEmployeeId={filters.filterEmployeeId}
            setFilterEmployeeId={filters.setFilterEmployeeId}
            filterStatus={filters.filterStatus}
            setFilterStatus={filters.setFilterStatus}
            workLocations={data.workLocations}
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
            pageSize={filters.pageSize}
            setPageSize={filters.setPageSize}
            page={filters.page}
            setPage={filters.setPage}
            totalPages={filters.totalPages}
            onSelectRecord={setSelectedRecord}
            onEditRecord={setEditingRecord}
            onDeleteRecord={mutations.handleDeleteRecord}
            onLogTimeForEmployee={handleOpenTimeLog}
            totalRecordsCount={data.records.length}
            onResetFilters={filters.handleResetFilters}
            isFiltered={filters.isFiltered}
          />
        </>
      )}

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
        canManageSettings={canManageOvertimeSettings}
        employees={data.employees}
        workLocations={data.workLocations}
        myEmployee={data.myEmployee}
        saving={mutations.saving}
        onSaveNewRecord={handleSaveNewRecord}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={mutations.handleDeleteRecord}
        showOvertimeSettings={canAccessOvertime && canManageOvertimeSettings && overtime.showOvertimeSettings}
        onCloseOvertimeSettings={() => overtime.setShowOvertimeSettings(false)}
      />
    </div>
  );
}
