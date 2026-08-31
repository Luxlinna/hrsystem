import { useDisciplinary } from "./hooks/useDisciplinary";
import { DisciplinaryHeader } from "./components/DisciplinaryHeader";
import { OverdueAlertBanner } from "./components/OverdueAlertBanner";
import { DisciplinaryMetricCards } from "./components/DisciplinaryMetricCards";
import { NavigationTabs } from "./components/NavigationTabs";
import { FilterBar } from "./components/FilterBar";
import { DisciplinaryTableView } from "./components/DisciplinaryTableView";
import { DisciplinaryCardsView } from "./components/DisciplinaryCardsView";
import { DisciplinaryDrawer } from "./components/DisciplinaryDrawer";
import { DisciplinaryModal } from "./components/DisciplinaryModal";
import { Pagination } from "./components/Pagination";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function DisciplinaryPage() {
  const {
    canManage, isSuperAdmin, userBranchName, isPartnerBranchBlocked,
    employees, branches, loading, selectedRecord, setSelectedRecord,
    showModal, setShowModal, saving, newRecord, setNewRecord,
    activeTab, setActiveTab, filterType, setFilterType,
    filterStatus, setFilterStatus, filterSeverity, setFilterSeverity,
    filterScope, setFilterScope, searchQuery, setSearchQuery,
    viewMode, setViewMode, pageSize, setPageSize,
    page, setPage, openCount, pipCount, criticalCount,
    resolvedCount, overdueCount, filteredRecords, totalPages,
    pagedRecords, handleCreateRecord, handleUpdateStatus,
    handleDeleteRecord, handleExportCSV, openCreateModal,
  } = useDisciplinary();

  if (loading && filteredRecords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading disciplinary hub...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <DisciplinaryHeader
          recordsCount={0}
          canManage={false}
          onExportCSV={() => {}}
          onOpenCreateModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Disciplinary & PIP Hub"
          userBranchName={userBranchName}
          hasNoBranch={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <DisciplinaryHeader
        recordsCount={filteredRecords.length}
        canManage={canManage}
        onOpenCreateModal={openCreateModal}
        records={filteredRecords}
      />

      <OverdueAlertBanner
        canManage={canManage}
        overdueCount={overdueCount}
        onReviewOverdue={() => {
          setActiveTab("all");
          setFilterStatus("open");
        }}
      />

      <DisciplinaryMetricCards
        openCount={openCount}
        pipCount={pipCount}
        criticalCount={criticalCount}
        resolvedCount={resolvedCount}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalCount={filteredRecords.length}
        openCount={openCount}
        pipCount={pipCount}
        criticalCount={criticalCount}
        resolvedCount={resolvedCount}
      />

      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterScope={filterScope}
        setFilterScope={setFilterScope}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSuperAdmin={isSuperAdmin}
      />

      {viewMode === "table" ? (
        <DisciplinaryTableView
          records={pagedRecords}
          onSelectRecord={setSelectedRecord}
        />
      ) : (
        <DisciplinaryCardsView
          records={pagedRecords}
          selectedRecordId={selectedRecord?.id || null}
          canManage={canManage}
          onSelectRecord={setSelectedRecord}
          onOpenCreateModal={openCreateModal}
        />
      )}

      {filteredRecords.length > 0 && (
        <div className="mt-6">
          <Pagination
            totalCount={filteredRecords.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </div>
      )}

      <DisciplinaryDrawer
        record={selectedRecord}
        canManage={canManage}
        onClose={() => setSelectedRecord(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteRecord={handleDeleteRecord}
      />

      <DisciplinaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employees={employees}
        branches={branches}
        isSuperAdmin={isSuperAdmin}
        activeBranchName={userBranchName}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={saving}
        onSubmit={handleCreateRecord}
      />
    </div>
  );
}