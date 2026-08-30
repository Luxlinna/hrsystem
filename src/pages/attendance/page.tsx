import { useAttendance } from "./hooks/useAttendance";
import { AttendanceHeader } from "./components/AttendanceHeader";
import { SelfCheckInBanner } from "./components/SelfCheckInBanner";
import { AttendanceKpiBar } from "./components/AttendanceKpiBar";
import { AttendanceWorkSitePills } from "./components/AttendanceWorkSitePills";
import { AttendanceControlBar } from "./components/AttendanceControlBar";
import { RecordDetailsDrawer } from "./components/RecordDetailsDrawer";
import { LogAttendanceModal } from "./components/LogAttendanceModal";
import { EditAttendanceModal } from "./components/EditAttendanceModal";
import { RecordsTab } from "./tabs/RecordsTab";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function AttendancePage() {
  const {
    canManage, canViewAll, todayYMD, userBranchName, userBranchId,
    selectedRecord, setSelectedRecord, editingRecord, setEditingRecord,
    showLogModal, setShowLogModal, newRecord, setNewRecord,
    myTodayRecord, data, filters, metrics, mutations,
    openLogModal, handleSaveNewRecord, handleUpdateRecord,
  } = useAttendance();

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

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      <AttendanceHeader
        currentTime={data.currentTime}
        activeTab={filters.activeTab}
        dateRangeBounds={filters.dateRangeBounds}
        canViewAll={canViewAll}
        hasEmployee={!!data.myEmployee}
        onExportCSV={filters.handleExportCSV}
        onOpenLogModal={openLogModal}
      />

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
        pageSize={filters.pageSize}
        setPageSize={filters.setPageSize}
        page={filters.page}
        setPage={filters.setPage}
        totalPages={filters.totalPages}
        onSelectRecord={setSelectedRecord}
        onEditRecord={setEditingRecord}
        onDeleteRecord={mutations.handleDeleteRecord}
      />

      <RecordDetailsDrawer
        selectedRecord={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        canManage={canManage}
        onOpenEditModal={setEditingRecord}
        onDeleteRecord={mutations.handleDeleteRecord}
      />

      <LogAttendanceModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        canManage={canManage}
        employees={data.employees}
        workLocations={data.workLocations}
        myEmployee={data.myEmployee}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={mutations.saving}
        onSubmit={handleSaveNewRecord}
      />

      <EditAttendanceModal
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        workLocations={data.workLocations}
        saving={mutations.saving}
        onClose={() => setEditingRecord(null)}
        onSubmit={handleUpdateRecord}
      />
    </div>
  );
}
