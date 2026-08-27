import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type {
  Employee,
  DisciplinaryRecord,
  NewRecord,
  DisciplinaryTabKey,
  ViewMode,
} from "../types";
import { STATUS_CONFIG, INITIAL_NEW_RECORD, isOverdueRecord } from "../constants";
import { exportDisciplinaryCSV } from "../exportUtils";

export function useDisciplinary() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.disciplinary_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.disciplinary_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;

  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<DisciplinaryTabKey>("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  const [newRecord, setNewRecord] = useState<NewRecord>(INITIAL_NEW_RECORD);

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (canViewAll) {
      const [rRes, eRes] = await Promise.all([
        supabase
          .from("disciplinary_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url")
          .eq("status", "active")
          .order("first_name"),
      ]);
      if (rRes.data) setRecords(rRes.data as DisciplinaryRecord[]);
      if (eRes.data) setEmployees(eRes.data);
      setLoading(false);
      return;
    }

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, branch_id")
      .eq("email", user.email)
      .maybeSingle();

    if (!me) {
      setEmployees([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .eq("status", "active")
        .eq("branch_id", me.branch_id)
        .order("first_name");
      setEmployees(team || []);
      const ids = (team || []).map((e) => e.id);
      const { data: rData } = ids.length
        ? await supabase
            .from("disciplinary_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
            .in("employee_id", ids)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
        : { data: [] };
      setRecords((rData as DisciplinaryRecord[]) || []);
      setLoading(false);
      return;
    }

    setEmployees([me]);
    const { data: rData } = await supabase
      .from("disciplinary_records")
      .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
      .eq("employee_id", me.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRecords((rData as DisciplinaryRecord[]) || []);
    setLoading(false);
  }, [canViewAll, canViewOwnBranch, user?.email]);

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, fetchData]);

  // Filter calculation
  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Tab Filtering
      if (
        activeTab === "open" &&
        r.status !== "open" &&
        r.status !== "in_progress" &&
        r.status !== "escalated"
      )
        return false;
      if (activeTab === "pip" && r.type !== "pip") return false;
      if (activeTab === "critical" && r.severity !== "critical" && r.severity !== "high")
        return false;
      if (activeTab === "resolved" && r.status !== "resolved" && r.status !== "closed")
        return false;

      // Dropdown Filters
      if (filterType && r.type !== filterType) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSeverity && r.severity !== filterSeverity) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const emp = r.employees;
        const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
        const title = (r.title || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        const dept = emp ? (emp.department || "").toLowerCase() : "";
        if (!name.includes(q) && !title.includes(q) && !desc.includes(q) && !dept.includes(q))
          return false;
      }
      return true;
    });
  }, [records, activeTab, filterType, filterStatus, filterSeverity, searchQuery]);

  // Aggregate Metrics
  const openCount = useMemo(
    () =>
      records.filter(
        (r) => r.status === "open" || r.status === "in_progress" || r.status === "escalated"
      ).length,
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
  const overdueCount = useMemo(() => records.filter(isOverdueRecord).length, [records]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedRecords = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newRecord.employee_id || !newRecord.title.trim() || saving) return;
      setSaving(true);

      const empObj = employees.find((e) => e.id === newRecord.employee_id);
      const empName = empObj ? `${empObj.first_name} ${empObj.last_name}` : newRecord.employee_id;

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
    [newRecord, saving, employees, actorName, role?.name, fetchData]
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
    setNewRecord(INITIAL_NEW_RECORD);
    setShowModal(true);
  }, []);

  return {
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
