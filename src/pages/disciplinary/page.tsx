import { useCallback } from "react";
import { DisciplinaryHeader } from "./components/DisciplinaryHeader";
import { OverdueAlertBanner } from "./components/OverdueAlertBanner";
import { DisciplinaryMetricCards } from "./components/DisciplinaryMetricCards";
import { NavigationTabs } from "./components/NavigationTabs";
import { FilterBar } from "./components/FilterBar";
import { DisciplinaryCardsView } from "./components/DisciplinaryCardsView";
import { DisciplinaryTableView } from "./components/DisciplinaryTableView";
import { Pagination } from "./components/Pagination";
import { DisciplinaryDrawer } from "./components/DisciplinaryDrawer";
import { DisciplinaryModal } from "./components/DisciplinaryModal";
import { useDisciplinary } from "./hooks/useDisciplinary";

export default function DisciplinaryPage() {
  const {
    canManage,
    records,
    employees,
    loading,
    selectedRecord,
    setSelectedRecord,
    showModal,
    setShowModal,
    saving,
    activeTab,
    setActiveTab,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterSeverity,
    setFilterSeverity,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    newRecord,
    setNewRecord,
    filtered,
    openCount,
    pipCount,
    criticalCount,
    resolvedCount,
    overdueCount,
    totalPages,
    pagedRecords,
    handleSave,
    updateStatus,
    deleteRecord,
    handleExportCSV,
    openCreateModal,
  } = useDisciplinary();

  const handleSelectTab = useCallback(
    (tab: typeof activeTab) => {
      setActiveTab(tab);
      setPage(1);
    },
    [setActiveTab, setPage]
  );

  const handleFilterChangeResetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  if (loading && records.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading disciplinary & compliance records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <DisciplinaryHeader
        recordsCount={records.length}
        canManage={canManage}
        onExportCSV={handleExportCSV}
        onOpenCreateModal={openCreateModal}
      />

      {/* Overdue Follow-up Alert Banner */}
      <OverdueAlertBanner
        canManage={canManage}
        overdueCount={overdueCount}
        onReviewOverdue={() => handleSelectTab("open")}
      />

      {/* Executive Metric Cards */}
      <DisciplinaryMetricCards
        openCount={openCount}
        pipCount={pipCount}
        criticalCount={criticalCount}
        resolvedCount={resolvedCount}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Filter Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        totalCount={records.length}
        openCount={openCount}
        pipCount={pipCount}
        criticalCount={criticalCount}
        resolvedCount={resolvedCount}
      />

      {/* Search & Secondary Filter Controls Bar */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onFilterChangeResetPage={handleFilterChangeResetPage}
      />

      {/* Main Records Display */}
      {viewMode === "cards" ? (
        <DisciplinaryCardsView
          records={pagedRecords}
          selectedRecordId={selectedRecord?.id ?? null}
          canManage={canManage}
          onSelectRecord={setSelectedRecord}
          onOpenCreateModal={openCreateModal}
        />
      ) : (
        <DisciplinaryTableView
          records={pagedRecords}
          onSelectRecord={setSelectedRecord}
        />
      )}

      {/* Pagination Controls */}
      <Pagination
        totalCount={filtered.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />

      {/* Case Investigation Drawer */}
      <DisciplinaryDrawer
        record={selectedRecord}
        canManage={canManage}
        onClose={() => setSelectedRecord(null)}
        onUpdateStatus={updateStatus}
        onDeleteRecord={deleteRecord}
      />

      {/* Incident / PIP Composer Modal */}
      <DisciplinaryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        employees={employees}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={saving}
        onSubmit={handleSave}
      />
    </div>
  );
}