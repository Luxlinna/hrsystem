import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type {
  Employee,
  DisciplinaryRecord,
  NewRecord,
  DisciplinaryTabKey,
  ViewMode,
  Branch,
} from "../types";
import { STATUS_CONFIG, INITIAL_NEW_RECORD, isOverdueRecord } from "../constants";
import { exportDisciplinaryCSV } from "../exportUtils";

export function useDisciplinary() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName)) && !isPartnerBranchBlocked;

  const canManage = isLeader;

  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<DisciplinaryTabKey>("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "admin" | "branch">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  const [newRecord, setNewRecord] = useState<NewRecord>(INITIAL_NEW_RECORD);

  const fetchData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRecords([]);
      setEmployees([]);
      setBranches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch all active branches for modals/labels
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");

      setBranches((bData as Branch[]) || []);

      // 2. Fetch employees for active branch
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .eq("status", "active")
        .eq("branch_id", targetBranch)
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.error("Disciplinary employees query error:", empErr);
      const empList = (empData || []) as Employee[];
      const empIds = empList.map((e) => e.id);
      setEmployees(empList);

      // 3. Fetch disciplinary records
      let recordList: DisciplinaryRecord[] = [];
      const query = supabase
        .from("disciplinary_records")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
        .is("deleted_at", null);

      let scopedQuery = query;
      if (isLeader) {
        scopedQuery = scopedQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      } else {
        const staffId = myEmployee?.id || empIds[0];
        scopedQuery = scopedQuery.eq("employee_id", staffId || "");
      }

      const { data: rData, error: rErr } = await scopedQuery.order("created_at", { ascending: false });
      if (rErr) {
        console.warn("Scoped disciplinary query error, using fallback:", rErr);
        const { data: fallbackData } = await supabase
          .from("disciplinary_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        const rawList = (fallbackData as unknown as DisciplinaryRecord[]) || [];
        const empIdSet = new Set(empIds);
        recordList = rawList.filter((r: any) => !r.employee_id || empIdSet.has(r.employee_id) || r.employees?.branch_id === targetBranch);
      } else {
        recordList = (rData as unknown as DisciplinaryRecord[]) || [];
      }

      setRecords(recordList);
    } catch (err) {
      console.error("Failed to load disciplinary data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab Filtering & Counts
  const openCount = useMemo(
    () => records.filter((r) => r.status === "open" || r.status === "in_progress").length,
    [records]
  );
  const pipCount = useMemo(() => records.filter((r) => r.type === "pip").length, [records]);
  const criticalCount = useMemo(
    () => records.filter((r) => r.severity === "critical" || r.severity === "high").length,
    [records]
  );
  const resolvedCount = useMemo(
    () => records.filter((r) => r.status === "resolved" || r.status === "closed").length,
    [records]
  );
  const overdueCount = useMemo(
    () => records.filter((r) => isOverdueRecord(r)).length,
    [records]
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Tab Filter
      if (activeTab === "open" && r.status !== "open" && r.status !== "in_progress") return false;
      if (activeTab === "pip" && r.type !== "pip") return false;
      if (activeTab === "critical" && r.severity !== "critical" && r.severity !== "high")
        return false;
      if (activeTab === "resolved" && r.status !== "resolved" && r.status !== "closed")
        return false;

      // Dropdown Filters
      if (filterType && r.type !== filterType) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSeverity && r.severity !== filterSeverity) return false;

      // Scope Filter (Company-Wide vs Branch Only)
      if (filterScope === "admin" && r.branch_id) return false;
      if (filterScope === "branch" && !r.branch_id) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = r.employees
          ? `${r.employees.first_name} ${r.employees.last_name}`.toLowerCase()
          : "";
        const dept = r.employees?.department?.toLowerCase() || "";
        const title = r.title.toLowerCase();
        const desc = (r.description || "").toLowerCase();
        if (
          !empName.includes(q) &&
          !dept.includes(q) &&
          !title.includes(q) &&
          !desc.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [records, activeTab, filterType, filterStatus, filterSeverity, filterScope, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedRecords = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [activeTab, filterType, filterStatus, filterSeverity, filterScope, searchQuery, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Actions
  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRecord.employee_id || !newRecord.title.trim()) {
        toast("Missing Information", "Please select an employee and provide a title.", "error");
        return;
      }
      if (!canManage) {
        toast("Permission Denied", "Only administrators and managers can file disciplinary records.", "error");
        return;
      }

      setSaving(true);
      const empObj = employees.find((e) => e.id === newRecord.employee_id);
      const empName = empObj ? `${empObj.first_name} ${empObj.last_name}` : newRecord.employee_id;

      const resolvedBranchId = newRecord.is_admin_scope
        ? null
        : (newRecord.branch_id || targetBranch || empObj?.branch_id || null);

      const { error } = await supabase.from("disciplinary_records").insert({
        employee_id: newRecord.employee_id,
        type: newRecord.type,
        title: newRecord.title.trim(),
        description: newRecord.description.trim() || null,
        severity: newRecord.severity,
        status: newRecord.status,
        incident_date: newRecord.incident_date || null,
        follow_up_date: newRecord.follow_up_date || null,
        created_by: actorName,
        witnesses: newRecord.witnesses.trim() || null,
        action_taken: newRecord.action_taken.trim() || null,
        pip_start_date:
          newRecord.type === "pip" && newRecord.pip_start_date ? newRecord.pip_start_date : null,
        pip_end_date:
          newRecord.type === "pip" && newRecord.pip_end_date ? newRecord.pip_end_date : null,
        pip_goals: newRecord.type === "pip" && newRecord.pip_goals ? newRecord.pip_goals : null,
        branch_id: resolvedBranchId,
      });

      setSaving(false);
      if (error) {
        toast("Error", "Failed to save disciplinary record: " + error.message, "error");
        return;
      }

      toast("Record Filed", `Disciplinary record filed for ${empName}.`, "success");
      logActivity({
        module: "disciplinary",
        action: "created",
        entityType: "disciplinary_record",
        actorName,
        actorRole: role?.name || "HR Manager",
        description: `Filed ${newRecord.type} for ${empName}: "${newRecord.title}"`,
      });

      setShowModal(false);
      setNewRecord(INITIAL_NEW_RECORD);
      fetchData();
    },
    [newRecord, canManage, employees, targetBranch, actorName, role?.name, fetchData]
  );

  const updateStatus = useCallback(
    async (id: string, newStatus: string) => {
      const { error } = await supabase
        .from("disciplinary_records")
        .update({
          status: newStatus,
          resolved_at: newStatus === "resolved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) {
        toast("Error", "Failed to update status", "error");
        return;
      }

      setSelectedRecord((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              status: newStatus as DisciplinaryRecord["status"],
              resolved_at: newStatus === "resolved" ? new Date().toISOString() : prev.resolved_at,
            }
          : prev
      );

      toast(
        "Status Updated",
        `Case marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}.`,
        "success"
      );
      logActivity({
        module: "disciplinary",
        action: "updated",
        entityType: "disciplinary_record",
        entityId: id,
        actorName,
        actorRole: role?.name || "HR Manager",
        description: `Updated case status to ${newStatus}`,
      });

      fetchData();
    },
    [actorName, role?.name, fetchData]
  );

  const deleteRecord = useCallback(
    async (record: DisciplinaryRecord) => {
      if (!canManage) return;
      if (!confirm(`Move record "${record.title}" to the Recycle Bin? It can be restored later.`))
        return;

      const { error } = await supabase
        .from("disciplinary_records")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", record.id);

      if (error) {
        toast("Error", "Failed to delete record", "error");
        return;
      }

      setSelectedRecord(null);
      toast("Moved to Recycle Bin", "The record can be restored from the Recycle Bin.", "success");
      logActivity({
        module: "disciplinary",
        action: "deleted",
        entityType: "disciplinary_record",
        entityId: record.id,
        actorName,
        actorRole: role?.name || "HR Manager",
        description: `Moved disciplinary record "${record.title}" to Recycle Bin`,
      });

      fetchData();
    },
    [canManage, actorName, role?.name, fetchData]
  );

  const handleExportCSV = useCallback(() => {
    exportDisciplinaryCSV(filtered);
  }, [filtered]);

  const openCreateModal = useCallback(() => {
    if (!canManage) {
      toast("Permission Denied", "Only administrators and managers can log disciplinary records.", "error");
      return;
    }
    setNewRecord({
      ...INITIAL_NEW_RECORD,
      is_admin_scope: isSuperAdmin && !effectiveBranchId,
      branch_id: targetBranch || "",
    });
    setShowModal(true);
  }, [canManage, isSuperAdmin, effectiveBranchId, targetBranch]);

  return {
    canManage,
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    branches,
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
    filterScope,
    setFilterScope,
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
    safePage,
    pageStart,
    pageEnd,
    pagedRecords,
    handleSave,
    updateStatus,
    deleteRecord,
    handleExportCSV,
    openCreateModal,
  };
}
