import { useState } from "react";
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

export default function AttendancePage() {
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);
  const [timeLogInitialEmployeeId, setTimeLogInitialEmployeeId] = useState<string | undefined>(undefined);

  const {
    canManage, canViewAll, todayYMD, userBranchName, userBranchId, isFourPunchMode,
    selectedRecord, setSelectedRecord, editingRecord, setEditingRecord,
    showLogModal, setShowLogModal, newRecord, setNewRecord,
    myTodayRecord, data, filters, metrics, mutations,
    handleSaveNewRecord, handleUpdateRecord,
  } = useAttendance();

  const overtime = useAttendanceOvertime({
    targetBranch: data.targetBranch,
    myEmployeeId: data.myEmployee?.id,
    canViewAll,
  });

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
          hasEmployee={false}
          onExportCSV={() => {}}
          onOpenLogModal={() => {}}
        />
        <PartnerBranchPrivacyShield moduleName="Attendance & Time Tracking" userBranchName={userBranchName} hasNoBranch={!userBranchId} />
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

  if (overtime.showOvertimeForm) {
    return (
      <CreateOvertimeForm
        onBack={() => overtime.setShowOvertimeForm(false)}
        employees={data.employees}
        initialEmployeeId={canViewAll ? undefined : data.myEmployee?.id}
        isEmployeeFixed={!canViewAll && !!data.myEmployee}
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
        hasEmployee={!!data.myEmployee}
        onExportCSV={filters.handleExportCSV}
        onOpenLogModal={() => handleOpenTimeLog()}
        onOpenOvertime={() => overtime.setShowOvertimeForm(true)}
        activeMainTab={overtime.activeMainTab}
        setActiveMainTab={overtime.setActiveMainTab}
        records={filters.filteredRecords.length > 0 ? filters.filteredRecords : data.records}
        summaries={metrics.employeeSummary || []}
        isFourPunchMode={isFourPunchMode}
      />

      {overtime.activeMainTab === "overtime" ? (
        <OvertimeTab
          records={overtime.overtimeRecords}
          canManage={canManage}
          onOpenCreate={() => overtime.setShowOvertimeForm(true)}
          onExport={overtime.handleExport}
          onApprove={overtime.handleApprove}
          onReject={overtime.handleReject}
          onDelete={overtime.handleDelete}
        />
      ) : (
        <>
          <SelfCheckInBanner myEmployee={data.myEmployee} myTodayRecord={myTodayRecord} />

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
