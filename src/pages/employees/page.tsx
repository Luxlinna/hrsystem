import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeesHeader } from "./components/EmployeesHeader";
import { EmployeesFilterBar } from "./components/EmployeesFilterBar";
import { SelectedActionsBar } from "./components/SelectedActionsBar";
import { EmployeesTableView } from "./components/EmployeesTableView";
import { EmployeesGridView } from "./components/EmployeesGridView";
import { Pagination } from "./components/Pagination";
import { AddEmployeeModal } from "./components/AddEmployeeModal";
import { SetUpPhoneAccountModal } from "./components/SetUpPhoneAccountModal";
import { ImportEmployeesModal } from "./components/ImportEmployeesModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useEmployees } from "./hooks/useEmployees";
import { useEmployeePermission } from "./hooks/useEmployeePermission";
import { INITIAL_EMPLOYEE_FORM, getBranchCode, deriveBuHandle } from "./constants";

export default function EmployeesPage() {
  const {
    canManage, isSuperAdmin, isPartnerBranchBlocked, userBranchId, userBranchName,
    targetBranch, branches, workSites, contractTypes, jobStatuses, biometricDevices, selectedBranchId, visibleBranches, search, setSearch,
    filterDept, setFilterDept, filterStatus, setFilterStatus, filterJobStatus, setFilterJobStatus,
    filterRole, setFilterRole, filterEmployeeType, setFilterEmployeeType, filterEmployeeLevel, setFilterEmployeeLevel,
    filterBranch, setFilterBranch,
    filterWorkLocation, setFilterWorkLocation, employeeLocations = [],
    filterAccount, setFilterAccount, filterDateOption, setFilterDateOption,
    filterContractType, setFilterContractType, sortField, sortDirection, selectedIds, selectAll,
    pageSize, setPageSize, page, setPage, showAddModal, setShowAddModal,
    editingEmployeeId, setEditingEmployeeId, handleOpenEditModal, handleCloseModal,
    form, setForm,
    submitting, accountStatus, invitingId, deletingId, showFilters, setShowFilters,
    showColumnMenu, setShowColumnMenu, visibleColumns, setVisibleColumns, viewMode,
    setViewMode, depts, positions, employeeTypes, employeeLevels, branchCount, managers, stats, filtered, empTotalPages,
    empPageStart, empPageEnd, pagedEmployees, tableGridStyle, handleSort, handleSelectAll,
    handleSelectOne, bulkInvite, bulkDelete, handleAddEmployee,
    inviteUser, phoneAccountEmployee, setPhoneAccountEmployee, setUpPhoneUser,
    deleteEmployee, disableEmployee, deactivateEmployee, roles,
    loadEmployees, actorName, roleName,
  } = useEmployees();

  const navigate = useNavigate();
  const { canManageEmployeeSettings } = useEmployeePermission();
  const [showSalary, setShowSalary] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleOpenAddModal = useCallback(() => {
    setEditingEmployeeId(null);
    const isSite = selectedBranchId && selectedBranchId.startsWith("site:");
    const branchId = isSite
      ? (visibleBranches.find((b) => b.id === selectedBranchId)?.branch_id || "")
      : (selectedBranchId || targetBranch || userBranchId || "");
    const siteId = isSite ? selectedBranchId.substring(5) : "";

    const branch = branches.find((b) => b.id === branchId);
    const branchName = branch?.name || "";
    const code = branchName ? getBranchCode(branchName) : "";
    const handle = branchName ? deriveBuHandle(branchName, code) : "";

    setForm({
      ...INITIAL_EMPLOYEE_FORM,
      branch_id: branchId,
      code_bu: code,
      bu_full_name: branchName,
      handle_bu: handle,
      site: branchName ? `Main Office (${branchName})` : "Main Office",
      working_location: branch?.location || "Phnom Penh",
      default_work_location_id: siteId,
    });
    setShowAddModal(true);
  }, [selectedBranchId, targetBranch, userBranchId, visibleBranches, branches, setForm, setShowAddModal, setEditingEmployeeId]);

  const handleInviteEmployee = useCallback(
    (e: any) => inviteUser(e.email, e.first_name, e.last_name, e.role),
    [inviteUser]
  );

  if (isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <EmployeesHeader
          branchCount={branchCount}
          canManage={false}
          onOpenAddModal={() => {}}
          canManageSettings={canManageEmployeeSettings}
          onOpenSettings={() => navigate("/employees/settings")}
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
    <div className="min-h-screen bg-white p-4 sm:p-6 font-sans">
      <EmployeesHeader
        branchCount={branchCount}
        canManage={canManage}
        onOpenAddModal={handleOpenAddModal}
        canManageSettings={canManageEmployeeSettings}
        onOpenSettings={() => navigate("/employees/settings")}
      />

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
        filterJobStatus={filterJobStatus}
        setFilterJobStatus={setFilterJobStatus}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterEmployeeType={filterEmployeeType}
        setFilterEmployeeType={setFilterEmployeeType}
        filterEmployeeLevel={filterEmployeeLevel}
        setFilterEmployeeLevel={setFilterEmployeeLevel}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterAccount={filterAccount}
        setFilterAccount={setFilterAccount}
        filterDateOption={filterDateOption}
        setFilterDateOption={setFilterDateOption}
        filterContractType={filterContractType}
        setFilterContractType={setFilterContractType}
        contractTypes={contractTypes}
        jobStatuses={jobStatuses}
        depts={depts}
        positions={positions}
        employeeTypes={employeeTypes}
        employeeLevels={employeeLevels}
        branches={branches}
        workSites={workSites}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        viewMode={viewMode}
        setViewMode={setViewMode}
        employees={filtered}
        accountStatus={accountStatus}
        onOpenImport={() => setShowImportModal(true)}
        showSalary={showSalary}
        setShowSalary={setShowSalary}
      />

      <SelectedActionsBar
        selectedCount={selectedIds.size}
        canManage={canManage}
        onBulkInvite={bulkInvite}
        onBulkDelete={bulkDelete}
        onClearSelection={handleSelectAll}
      />

      <div className="bg-white border-t border-slate-100 overflow-hidden">
        {viewMode === "table" ? (
          <EmployeesTableView
            employees={pagedEmployees}
            accountStatus={accountStatus}
            biometricDevices={biometricDevices}
            selectedIds={selectedIds}
            selectAll={selectAll}
            visibleColumns={visibleColumns}
            sortField={sortField}
            sortDirection={sortDirection}
            canManage={canManage}
            invitingId={invitingId}
            deletingId={deletingId}
            tableGridStyle={tableGridStyle}
            showSalary={showSalary}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onSort={handleSort}
            onInvite={handleInviteEmployee}
            onSetUpPhoneAccount={setPhoneAccountEmployee}
            onDelete={deleteEmployee}
            onEdit={handleOpenEditModal}
            onDisable={disableEmployee}
            onDeactivate={deactivateEmployee}
          />
        ) : (
          <EmployeesGridView
            employees={pagedEmployees}
            accountStatus={accountStatus}
            biometricDevices={biometricDevices}
            selectedIds={selectedIds}
            visibleColumns={visibleColumns}
            canManage={canManage}
            invitingId={invitingId}
            deletingId={deletingId}
            onSelectOne={handleSelectOne}
            onInvite={handleInviteEmployee}
            onSetUpPhoneAccount={setPhoneAccountEmployee}
            onDelete={deleteEmployee}
          />
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-team-line text-2xl text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-500">No employees found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

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

      <AddEmployeeModal
        isOpen={showAddModal}
        isEdit={Boolean(editingEmployeeId)}
        form={form}
        setForm={setForm}
        branches={branches}
        managers={managers}
        submitting={submitting}
        isSuperAdmin={isSuperAdmin}
        onClose={handleCloseModal}
        onSubmit={handleAddEmployee}
      />

      <SetUpPhoneAccountModal
        employee={phoneAccountEmployee}
        roles={roles}
        isOpen={Boolean(phoneAccountEmployee)}
        onClose={() => setPhoneAccountEmployee(null)}
        onSubmit={setUpPhoneUser}
      />

      <ImportEmployeesModal
        isOpen={showImportModal}
        branches={branches}
        actorName={actorName}
        roleName={roleName}
        onClose={() => setShowImportModal(false)}
        onSuccess={loadEmployees}
      />
    </div>
  );
}
