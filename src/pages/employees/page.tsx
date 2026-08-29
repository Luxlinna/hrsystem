import { useCallback } from "react";
import { EmployeesHeader } from "./components/EmployeesHeader";
import { EmployeesStatsRow } from "./components/EmployeesStatsRow";
import { EmployeesFilterBar } from "./components/EmployeesFilterBar";
import { SelectedActionsBar } from "./components/SelectedActionsBar";
import { EmployeesTableView } from "./components/EmployeesTableView";
import { EmployeesGridView } from "./components/EmployeesGridView";
import { Pagination } from "./components/Pagination";
import { AddEmployeeModal } from "./components/AddEmployeeModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useEmployees } from "./hooks/useEmployees";
import { INITIAL_EMPLOYEE_FORM } from "./constants";

export default function EmployeesPage() {
  const {
    canManage,
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    branches,
    selectedBranchId,
    visibleBranches,
    search,
    setSearch,
    filterDept,
    setFilterDept,
    filterStatus,
    setFilterStatus,
    filterBranch,
    setFilterBranch,
    filterAccount,
    setFilterAccount,
    sortField,
    sortDirection,
    selectedIds,
    selectAll,
    pageSize,
    setPageSize,
    page,
    setPage,
    showAddModal,
    setShowAddModal,
    form,
    setForm,
    submitting,
    accountStatus,
    invitingId,
    deletingId,
    showFilters,
    setShowFilters,
    showColumnMenu,
    setShowColumnMenu,
    visibleColumns,
    setVisibleColumns,
    viewMode,
    setViewMode,
    depts,
    branchCount,
    managers,
    stats,
    filtered,
    empTotalPages,
    empPageStart,
    empPageEnd,
    pagedEmployees,
    tableGridStyle,
    handleSort,
    handleSelectAll,
    handleSelectOne,
    bulkInvite,
    bulkDelete,
    handleExportCSV,
    handleAddEmployee,
    inviteUser,
    deleteEmployee,
  } = useEmployees();

  const handleOpenAddModal = useCallback(() => {
    const isSite = selectedBranchId && selectedBranchId.startsWith("site:");
    const branchId = isSite 
      ? (visibleBranches.find((b) => b.id === selectedBranchId)?.branch_id || "") 
      : (selectedBranchId || targetBranch || userBranchId || "");
    const siteId = isSite ? selectedBranchId.substring(5) : "";

    setForm({
      ...INITIAL_EMPLOYEE_FORM,
      branch_id: branchId,
      default_work_location_id: siteId,
    });
    setShowAddModal(true);
  }, [selectedBranchId, targetBranch, userBranchId, visibleBranches, setForm, setShowAddModal]);

  if (isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <EmployeesHeader
          branchCount={branchCount}
          canManage={false}
          onOpenAddModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Employee Directory"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <EmployeesHeader
        branchCount={branchCount}
        canManage={canManage}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Dashboard Statistics */}
      <EmployeesStatsRow stats={stats} branchCount={branchCount} />

      {/* Search and Filters */}
      <EmployeesFilterBar
        search={search}
        setSearch={setSearch}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        showColumnMenu={showColumnMenu}
        setShowColumnMenu={setShowColumnMenu}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterAccount={filterAccount}
        setFilterAccount={setFilterAccount}
        depts={depts}
        branches={branches}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExportCSV={handleExportCSV}
      />

      {/* Selected Actions Bar */}
      <SelectedActionsBar
        selectedCount={selectedIds.size}
        canManage={canManage}
        onBulkInvite={bulkInvite}
        onBulkDelete={bulkDelete}
        onClearSelection={handleSelectAll}
      />

      {/* Employee List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {viewMode === "table" ? (
          <EmployeesTableView
            employees={pagedEmployees}
            accountStatus={accountStatus}
            selectedIds={selectedIds}
            selectAll={selectAll}
            visibleColumns={visibleColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            canManage={canManage}
            invitingId={invitingId}
            deletingId={deletingId}
            tableGridStyle={tableGridStyle}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onSort={handleSort}
            onInvite={inviteUser}
            onDelete={deleteEmployee}
          />
        ) : (
          <EmployeesGridView
            employees={pagedEmployees}
            accountStatus={accountStatus}
            selectedIds={selectedIds}
            visibleColumns={visibleColumns}
            canManage={canManage}
            deletingId={deletingId}
            onSelectOne={handleSelectOne}
            onDelete={deleteEmployee}
          />
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-team-line text-3xl text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No employees found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        totalCount={filtered.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={empTotalPages}
        pageStart={empPageStart}
        pageEnd={empPageEnd}
      />

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddModal}
        form={form}
        setForm={setForm}
        branches={branches}
        managers={managers}
        submitting={submitting}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
      />
    </div>
  );
}
