import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { DisciplinaryRecord, NewRecord } from "../types";
import { INITIAL_NEW_RECORD } from "../constants";
import { useDisciplinaryData } from "./useDisciplinaryData";
import { useDisciplinaryFilters } from "./useDisciplinaryFilters";
import { useDisciplinaryMutations } from "./useDisciplinaryMutations";

export function useDisciplinary() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const roleName = role?.name || "Staff";
  const { isSuperAdmin, isBranchAdmin, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const isLeader =
    (isSuperAdmin ||
      isBranchAdmin ||
      isAdmin ||
      /manager|lead|head|admin|ceo|director|chief|president|officer/i.test((role?.name || "").toLowerCase())) &&
    !isPartnerBranchBlocked;

  const canManage = isLeader;

  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState<NewRecord>(INITIAL_NEW_RECORD);

  const data = useDisciplinaryData({
    targetBranch,
    isPartnerBranchBlocked,
    isLeader,
    myEmployeeId: myEmployee?.id,
  });

  const filters = useDisciplinaryFilters(data.records);

  const mutations = useDisciplinaryMutations({
    actorName,
    roleName,
    isSuperAdmin,
    targetBranch,
    employees: data.employees,
    fetchData: data.fetchData,
    setSelectedRecord,
    selectedRecord,
    setShowModal,
  });

  const openCreateModal = useCallback(() => {
    setNewRecord({
      ...INITIAL_NEW_RECORD,
      employee_id: data.employees[0]?.id || "",
      branch_id: targetBranch || "",
      is_admin_scope: isSuperAdmin,
    });
    setShowModal(true);
  }, [data.employees, targetBranch, isSuperAdmin]);

  const handleCreateRecordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    return mutations.handleCreateRecord(newRecord);
  }, [mutations, newRecord]);

  return {
    canManage,
    isSuperAdmin,
    userBranchName,
    isPartnerBranchBlocked,
    records: data.records,
    employees: data.employees,
    branches: data.branches,
    loading: data.loading,
    selectedRecord,
    setSelectedRecord,
    showModal,
    setShowModal,
    saving: mutations.saving,
    newRecord,
    setNewRecord,
    activeTab: filters.activeTab,
    setActiveTab: filters.setActiveTab,
    filterType: filters.filterType,
    setFilterType: filters.setFilterType,
    filterStatus: filters.filterStatus,
    setFilterStatus: filters.setFilterStatus,
    filterSeverity: filters.filterSeverity,
    setFilterSeverity: filters.setFilterSeverity,
    filterScope: filters.filterScope,
    setFilterScope: filters.setFilterScope,
    searchQuery: filters.searchQuery,
    setSearchQuery: filters.setSearchQuery,
    viewMode: filters.viewMode,
    setViewMode: filters.setViewMode,
    pageSize: filters.pageSize,
    setPageSize: filters.setPageSize,
    page: filters.page,
    setPage: filters.setPage,
    openCount: filters.openCount,
    pipCount: filters.pipCount,
    criticalCount: filters.criticalCount,
    resolvedCount: filters.resolvedCount,
    overdueCount: filters.overdueCount,
    filteredRecords: filters.filteredRecords,
    totalPages: filters.totalPages,
    pagedRecords: filters.pagedRecords,
    handleCreateRecord: handleCreateRecordSubmit,
    handleUpdateStatus: mutations.handleUpdateStatus,
    handleDeleteRecord: mutations.handleDeleteRecord,
    handleSaveNotes: mutations.handleSaveNotes,
    handleExportCSV: filters.handleExportCSV,
    openCreateModal,
  };
}
