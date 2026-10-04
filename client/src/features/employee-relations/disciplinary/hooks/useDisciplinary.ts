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
  const {
    isSuperAdmin,
    isBranchAdmin,
    userBranchId,
    userBranchName,
    targetBranch,
    selectedBranchId,
    effectiveBranchId,
    isPartnerBranchBlocked,
  } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const activeBranchId =
    (targetBranch && targetBranch !== "all" ? targetBranch : null) ||
    (selectedBranchId && selectedBranchId !== "all" && !selectedBranchId.startsWith("site:") ? selectedBranchId : null) ||
    effectiveBranchId ||
    userBranchId ||
    null;

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
    targetBranch: activeBranchId,
    isPartnerBranchBlocked,
    isLeader,
    isSuperAdmin,
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
    const activeBuId =
      activeBranchId ||
      data.branches.find((b) => b.name === userBranchName)?.id ||
      data.branches[0]?.id ||
      "";

    // Preselect employee from current BU if available
    const buEmployees = data.employees.filter((e) => !activeBuId || e.branch_id === activeBuId);
    const defaultEmpId = buEmployees[0]?.id || "";

    setNewRecord({
      ...INITIAL_NEW_RECORD,
      employee_id: defaultEmpId,
      branch_id: activeBuId,
      is_admin_scope: isSuperAdmin,
    });
    setShowModal(true);
  }, [activeBranchId, data.employees, data.branches, userBranchName, isSuperAdmin]);

  const handleEditRecord = useCallback(
    (record: DisciplinaryRecord) => {
      setNewRecord({
        id: record.id,
        employee_id: record.employee_id,
        type: record.warning_type || record.type || "first_written_warning",
        title: record.title || "",
        description: record.description || "",
        severity: record.severity || "medium",
        status: record.status || "open",
        incident_date: record.incident_date || record.warning_date || "",
        follow_up_date: record.follow_up_date || "",
        witnesses: record.witnesses || "",
        action_taken: record.action_taken || record.action_to_take || "",
        pip_start_date: record.pip_start_date || "",
        pip_end_date: record.pip_end_date || "",
        pip_goals: record.pip_goals || "",
        branch_id: record.branch_id || undefined,
        is_admin_scope: record.is_admin_scope,
        warning_type: record.warning_type || record.type || "first_written_warning",
        warning_date: record.warning_date || record.incident_date || "",
        action_to_take: record.action_to_take || record.action_taken || "",
        employee_promise: record.employee_promise || "",
        remark: record.remark || record.notes || "",
        document_url: record.document_url || "",
        document_name: record.document_name || "",
        document_file: null,
      });
      setShowModal(true);
    },
    [setShowModal]
  );

  const handleCreateRecordSubmit = useCallback(
    async (payloadOrEvent?: NewRecord | React.FormEvent) => {
      if (payloadOrEvent && typeof (payloadOrEvent as any).preventDefault === "function") {
        (payloadOrEvent as any).preventDefault();
      }
      const targetPayload = (payloadOrEvent && typeof payloadOrEvent === "object" && "employee_id" in payloadOrEvent)
        ? (payloadOrEvent as NewRecord)
        : newRecord;
      return mutations.handleCreateRecord(targetPayload);
    },
    [mutations, newRecord]
  );

  return {
    canManage,
    isSuperAdmin,
    userBranchName,
    activeBranchId,
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
    handleSelectTab: filters.handleSelectTab,
    totalCount: filters.totalCount,
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
    warningCount: filters.warningCount,
    openCount: filters.openCount,
    pipCount: filters.pipCount,
    criticalCount: filters.criticalCount,
    resolvedCount: filters.resolvedCount,
    overdueCount: filters.overdueCount,
    filteredRecords: filters.filteredRecords,
    totalPages: filters.totalPages,
    pagedRecords: filters.pagedRecords,
    handleCreateRecord: handleCreateRecordSubmit,
    handleEditRecord,
    handleVoidRecord: mutations.handleVoidRecord,
    handleDeleteRecord: mutations.handleDeleteRecord,
    handleExportCSV: filters.handleExportCSV,
    openCreateModal,
  };
}
