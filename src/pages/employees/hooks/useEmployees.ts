import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useEmployeesData } from "./useEmployeesData";
import { useEmployeesFilters } from "./useEmployeesFilters";
import { useEmployeesSelection } from "./useEmployeesSelection";
import { useEmployeesMutations } from "./useEmployeesMutations";

export function useEmployees() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const roleName = role?.name || "Staff";
  const {
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    branches: scopeBranches,
    selectedBranchId,
    selectedSiteId,
    visibleBranches,
  } = useBranchScope();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = (isAdmin || isBranchAdmin || !!role?.employees_manage) && !isPartnerBranchBlocked;

  const data = useEmployeesData({
    isPartnerBranchBlocked,
    targetBranch,
    selectedSiteId,
  });

  const filters = useEmployeesFilters({
    employees: data.employees,
    managerEmails: data.managerEmails,
    accountStatus: data.accountStatus,
    canManage,
  });

  const mutations = useEmployeesMutations({
    actorName,
    roleName,
    targetBranch,
    roles: data.roles,
    loadEmployees: data.loadEmployees,
  });

  const selection = useEmployeesSelection({
    pagedEmployees: filters.pagedEmployees,
    actorName,
    roleName,
    loadEmployees: data.loadEmployees,
    inviteUser: mutations.inviteUser,
  });

  return {
    canManage,
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    branches: data.branches,
    scopeBranches,
    selectedBranchId,
    visibleBranches,
    search: filters.search,
    setSearch: filters.setSearch,
    filterDept: filters.filterDept,
    setFilterDept: filters.setFilterDept,
    filterStatus: filters.filterStatus,
    setFilterStatus: filters.setFilterStatus,
    filterBranch: filters.filterBranch,
    setFilterBranch: filters.setFilterBranch,
    filterAccount: filters.filterAccount,
    setFilterAccount: filters.setFilterAccount,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
    selectedIds: selection.selectedIds,
    selectAll: selection.selectAll,
    pageSize: filters.pageSize,
    setPageSize: filters.setPageSize,
    page: filters.page,
    setPage: filters.setPage,
    showAddModal: mutations.showAddModal,
    setShowAddModal: mutations.setShowAddModal,
    form: mutations.form,
    setForm: mutations.setForm,
    submitting: mutations.submitting,
    accountStatus: data.accountStatus,
    invitingId: mutations.invitingId,
    deletingId: mutations.deletingId,
    showFilters: filters.showFilters,
    setShowFilters: filters.setShowFilters,
    showColumnMenu: filters.showColumnMenu,
    setShowColumnMenu: filters.setShowColumnMenu,
    visibleColumns: filters.visibleColumns,
    setVisibleColumns: filters.setVisibleColumns,
    viewMode: filters.viewMode,
    setViewMode: filters.setViewMode,
    depts: filters.depts,
    branchCount: filters.branchCount,
    managers: filters.managers,
    stats: filters.stats,
    filtered: filters.filtered,
    empTotalPages: filters.empTotalPages,
    empPageStart: filters.empPageStart,
    empPageEnd: filters.empPageEnd,
    pagedEmployees: filters.pagedEmployees,
    tableGridStyle: filters.tableGridStyle,
    handleSort: filters.handleSort,
    handleSelectAll: selection.handleSelectAll,
    handleSelectOne: selection.handleSelectOne,
    bulkInvite: selection.bulkInvite,
    bulkDelete: selection.bulkDelete,
    handleExportCSV: filters.handleExportCSV,
    handleAddEmployee: mutations.handleAddEmployee,
    inviteUser: mutations.inviteUser,
    deleteEmployee: mutations.deleteEmployee,
  };
}
