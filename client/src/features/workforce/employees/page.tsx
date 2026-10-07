import { useNavigate } from "react-router-dom";
import { EmployeesHeader } from "./components/EmployeesHeader";
import { EmployeesFilterBar } from "./components/EmployeesFilterBar";
import { SelectedActionsBar } from "./components/SelectedActionsBar";
import { EmployeesTableView } from "./components/EmployeesTableView";
import { EmployeesGridView } from "./components/EmployeesGridView";
import { Pagination } from "./components/Pagination";
import { EmployeesModals } from "./components/EmployeesModals";
import { useAuth } from "@/context/AuthContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useEmployees } from "./hooks/useEmployees";
import { useEmployeePermission } from "./hooks/useEmployeePermission";
import { useEmployeesPageState } from "./hooks/useEmployeesPageState";

export default function EmployeesPage() {
  const emp = useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canManageEmployeeSettings } = useEmployeePermission();

  const pageState = useEmployeesPageState({
    isSuperAdmin: emp.isSuperAdmin,
    userBranchId: emp.userBranchId,
    targetBranch: emp.targetBranch,
    branches: emp.branches,
    setForm: emp.setForm,
    setShowAddModal: emp.setShowAddModal,
    setEditingEmployeeId: emp.setEditingEmployeeId,
    inviteUser: emp.inviteUser,
  });

  if (emp.isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <EmployeesHeader
          branchCount={emp.branchCount}
          canManage={false}
          onOpenAddModal={() => {}}
          canManageSettings={canManageEmployeeSettings}
          onOpenSettings={() => navigate("/employees/settings")}
        />
        <PartnerBranchPrivacyShield
          moduleName="Employee Directory"
          userBranchName={emp.userBranchName}
          hasNoBranch={!emp.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 font-sans">
      <EmployeesHeader
        branchCount={emp.branchCount}
        canManage={emp.canManage}
        onOpenAddModal={pageState.handleOpenAddModal}
        onOpenChangeStatus={pageState.handleOpenChangeStatus}
        canManageSettings={canManageEmployeeSettings}
        onOpenSettings={() => navigate("/employees/settings")}
      />

      <EmployeesFilterBar
        search={emp.search} setSearch={emp.setSearch}
        showFilters={emp.showFilters} setShowFilters={emp.setShowFilters}
        showColumnMenu={emp.showColumnMenu} setShowColumnMenu={emp.setShowColumnMenu}
        filterDept={emp.filterDept} setFilterDept={emp.setFilterDept}
        filterStatus={emp.filterStatus} setFilterStatus={emp.setFilterStatus}
        filterJobStatus={emp.filterJobStatus} setFilterJobStatus={emp.setFilterJobStatus}
        filterRole={emp.filterRole} setFilterRole={emp.setFilterRole}
        filterEmployeeType={emp.filterEmployeeType} setFilterEmployeeType={emp.setFilterEmployeeType}
        filterEmployeeLevel={emp.filterEmployeeLevel} setFilterEmployeeLevel={emp.setFilterEmployeeLevel}
        filterBranch={emp.filterBranch} setFilterBranch={emp.setFilterBranch}
        filterWorkLocation={emp.filterWorkLocation} setFilterWorkLocation={emp.setFilterWorkLocation}
        filterAccount={emp.filterAccount} setFilterAccount={emp.setFilterAccount}
        filterDateOption={emp.filterDateOption} setFilterDateOption={emp.setFilterDateOption}
        filterContractType={emp.filterContractType} setFilterContractType={emp.setFilterContractType}
        contractTypes={emp.contractTypes} jobStatuses={emp.jobStatuses}
        depts={emp.depts} positions={emp.positions}
        employeeTypes={emp.employeeTypes} employeeLevels={emp.employeeLevels}
        branches={emp.branches} workSites={emp.workSites}
        visibleColumns={emp.visibleColumns} setVisibleColumns={emp.setVisibleColumns}
        viewMode={emp.viewMode} setViewMode={emp.setViewMode}
        employees={emp.filtered} accountStatus={emp.accountStatus}
        onOpenImport={() => pageState.setShowImportModal(true)}
        showSalary={pageState.showSalary}
        setShowSalary={pageState.handleToggleSalary}
      />

      <SelectedActionsBar
        selectedCount={emp.selectedIds.size}
        canManage={emp.canManage}
        onBulkInvite={emp.bulkInvite}
        onBulkDelete={emp.bulkDelete}
        onClearSelection={emp.handleSelectAll}
      />

      <div className="bg-white border-t border-slate-100 overflow-hidden">
        {emp.viewMode === "table" ? (
          <EmployeesTableView
            employees={emp.pagedEmployees}
            accountStatus={emp.accountStatus}
            biometricDevices={emp.biometricDevices}
            selectedIds={emp.selectedIds}
            selectAll={emp.selectAll}
            visibleColumns={emp.visibleColumns}
            sortField={emp.sortField}
            sortDirection={emp.sortDirection}
            canManage={emp.canManage}
            invitingId={emp.invitingId}
            deletingId={emp.deletingId}
            tableGridStyle={emp.tableGridStyle}
            showSalary={pageState.showSalary}
            onSelectAll={emp.handleSelectAll}
            onSelectOne={emp.handleSelectOne}
            onSort={emp.handleSort}
            onInvite={pageState.handleInviteEmployee}
            onSetUpPhoneAccount={emp.setPhoneAccountEmployee}
            onDelete={emp.deleteEmployee}
            onEdit={emp.handleOpenEditModal}
            onChangeStatus={pageState.handleOpenChangeStatus}
            onDisable={emp.disableEmployee}
            onDeactivate={emp.deactivateEmployee}
          />
        ) : (
          <EmployeesGridView
            employees={emp.pagedEmployees}
            accountStatus={emp.accountStatus}
            biometricDevices={emp.biometricDevices}
            selectedIds={emp.selectedIds}
            visibleColumns={emp.visibleColumns}
            canManage={emp.canManage}
            invitingId={emp.invitingId}
            deletingId={emp.deletingId}
            onSelectOne={emp.handleSelectOne}
            onInvite={pageState.handleInviteEmployee}
            onSetUpPhoneAccount={emp.setPhoneAccountEmployee}
            onDelete={emp.deleteEmployee}
          />
        )}

        {emp.filtered.length === 0 && (
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
        totalCount={emp.filtered.length}
        pageSize={emp.pageSize}
        setPageSize={emp.setPageSize}
        page={emp.page}
        setPage={emp.setPage}
        totalPages={emp.empTotalPages}
        pageStart={emp.empPageStart}
        pageEnd={emp.empPageEnd}
      />

      <EmployeesModals
        showAddModal={emp.showAddModal}
        editingEmployeeId={emp.editingEmployeeId}
        form={emp.form}
        setForm={emp.setForm}
        branches={emp.branches}
        managers={emp.managers}
        submitting={emp.submitting}
        isSuperAdmin={emp.isSuperAdmin}
        onCloseAddModal={emp.handleCloseModal}
        onAddEmployee={emp.handleAddEmployee}
        showChangeStatusModal={pageState.showChangeStatusModal}
        changeStatusEmployeeId={pageState.changeStatusEmployeeId}
        onCloseChangeStatus={() => {
          pageState.setShowChangeStatusModal(false);
          pageState.setChangeStatusEmployeeId("");
        }}
        employees={emp.allEmployees && emp.allEmployees.length > 0 ? emp.allEmployees : emp.filtered}
        depts={emp.depts}
        divisions={emp.divisions}
        positions={emp.positions}
        onLoadEmployees={emp.loadEmployees}
        phoneAccountEmployee={emp.phoneAccountEmployee}
        roles={emp.roles}
        onClosePhoneAccount={() => emp.setPhoneAccountEmployee(null)}
        onSetUpPhoneUser={emp.setUpPhoneUser}
        showImportModal={pageState.showImportModal}
        actorName={emp.actorName}
        roleName={emp.roleName}
        onCloseImport={() => pageState.setShowImportModal(false)}
        showPinModal={pageState.showPinModal}
        onClosePinModal={() => pageState.setShowPinModal(false)}
        onPinSuccess={() => pageState.setShowSalary(true)}
        userEmail={user?.email}
      />
    </div>
  );
}
