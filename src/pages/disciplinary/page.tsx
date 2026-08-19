import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { logActivity } from "@/lib/audit";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
}

interface DisciplinaryRecord {
  id: string;
  employee_id: string;
  type: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string | null;
  follow_up_date: string | null;
  resolved_at: string | null;
  created_by: string;
  witnesses: string | null;
  action_taken: string | null;
  pip_start_date: string | null;
  pip_end_date: string | null;
  pip_goals: string | null;
  created_at: string;
  employees?: Employee;
}

interface NewRecord {
  employee_id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated" | "closed";
  incident_date: string;
  follow_up_date: string;
  witnesses: string;
  action_taken: string;
  pip_start_date: string;
  pip_end_date: string;
  pip_goals: string;
}

// Case TYPE is a category, not an urgency level — severity and status below
// already carry the urgency signal. Encoding urgency three times in three
// different hues is what made this page read as a rainbow, so types are
// mostly neutral here and differentiated by their icon instead. Only the
// genuinely terminal actions (final warning, suspension) keep a warm tone.
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  verbal_warning: { label: "Verbal Warning", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600", icon: "ri-discuss-line", desc: "First-level policy review" },
  written_warning: { label: "Written Warning", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600", icon: "ri-file-warning-line", desc: "Formal documented notice" },
  final_warning: { label: "Final Warning", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30", icon: "ri-error-warning-line", desc: "Last notice before escalation" },
  pip: { label: "Performance Plan (PIP)", color: "text-[#253C7D] dark:text-sky-400", bg: "bg-[#253C7D]/10 border-[#253C7D]/20 dark:bg-sky-400/15 dark:border-sky-400/30", icon: "ri-focus-3-line", desc: "Structured performance goals" },
  incident: { label: "Workplace Incident", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30", icon: "ri-alert-line", desc: "Safety or policy violation" },
  suspension: { label: "Suspension", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30", icon: "ri-pause-circle-line", desc: "Temporary work removal" },
  termination: { label: "Termination", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-200/70 border-slate-300 dark:bg-slate-700/70 dark:border-slate-600", icon: "ri-user-unfollow-line", desc: "Employment separation" },
};

// Severity ramp: neutral → amber → rose. "critical" reuses rose rather than a
// separate red family (red and rose were near-identical on screen) and instead
// escalates via weight and a pulsing dot.
const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  low: { label: "Low", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600", dot: "bg-slate-400" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30", dot: "bg-amber-500" },
  high: { label: "High", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30", dot: "bg-rose-500" },
  critical: { label: "Critical", color: "text-rose-800 dark:text-rose-300", bg: "bg-rose-100 border-rose-300 dark:bg-rose-500/25 dark:border-rose-500/40 font-black", dot: "bg-rose-600 animate-pulse" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open Case", color: "text-[#253C7D] dark:text-sky-400", bg: "bg-[#253C7D]/10 border-[#253C7D]/20 dark:bg-sky-400/15 dark:border-sky-400/30" },
  in_progress: { label: "In Progress", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30" },
  escalated: { label: "Escalated", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30" },
  resolved: { label: "Resolved", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30" },
  closed: { label: "Closed", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600" },
};

// A case is overdue when it has a follow-up target date in the past and hasn't
// been resolved/closed yet. Shared by the KPI count, the tab filter, and the
// per-record overdue badges so all three stay in sync.
const isOverdueRecord = (r: Pick<DisciplinaryRecord, "follow_up_date" | "status">) =>
  !!r.follow_up_date &&
  r.status !== "resolved" &&
  r.status !== "closed" &&
  new Date(r.follow_up_date + "T00:00:00") < new Date();

export default function DisciplinaryPage() {
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
  const [activeTab, setActiveTab] = useState<"all" | "open" | "pip" | "critical" | "resolved">("all");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  const [newRecord, setNewRecord] = useState<NewRecord>({
    employee_id: "",
    type: "verbal_warning",
    title: "",
    description: "",
    severity: "medium",
    status: "open",
    incident_date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    witnesses: "",
    action_taken: "",
    pip_start_date: "",
    pip_end_date: "",
    pip_goals: "",
  });

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, canViewAll, canViewOwnBranch, user?.email]);

  async function fetchData() {
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
  }

  // Filter calculation
  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Tab Filtering
      if (activeTab === "open" && r.status !== "open" && r.status !== "in_progress" && r.status !== "escalated")
        return false;
      if (activeTab === "pip" && r.type !== "pip") return false;
      if (activeTab === "critical" && r.severity !== "critical" && r.severity !== "high") return false;
      if (activeTab === "resolved" && r.status !== "resolved" && r.status !== "closed") return false;

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
        if (!name.includes(q) && !title.includes(q) && !desc.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [records, activeTab, filterType, filterStatus, filterSeverity, searchQuery]);

  // Aggregate Metrics
  const openCount = useMemo(() => records.filter((r) => r.status === "open" || r.status === "in_progress" || r.status === "escalated").length, [records]);
  const pipCount = useMemo(() => records.filter((r) => r.type === "pip").length, [records]);
  const criticalCount = useMemo(() => records.filter((r) => r.severity === "critical" || r.severity === "high").length, [records]);
  const resolvedCount = useMemo(() => records.filter((r) => r.status === "resolved" || r.status === "closed").length, [records]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  async function handleSave(e: React.FormEvent) {
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
      pip_start_date: newRecord.type === "pip" && newRecord.pip_start_date ? newRecord.pip_start_date : null,
      pip_end_date: newRecord.type === "pip" && newRecord.pip_end_date ? newRecord.pip_end_date : null,
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
    setNewRecord({
      employee_id: "",
      type: "verbal_warning",
      title: "",
      description: "",
      severity: "medium",
      status: "open",
      incident_date: new Date().toISOString().split("T")[0],
      follow_up_date: "",
      witnesses: "",
      action_taken: "",
      pip_start_date: "",
      pip_end_date: "",
      pip_goals: "",
    });
    fetchData();
  }

  async function updateStatus(id: string, newStatus: string) {
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

    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord({
        ...selectedRecord,
        status: newStatus as DisciplinaryRecord["status"],
        resolved_at: newStatus === "resolved" ? new Date().toISOString() : selectedRecord.resolved_at,
      });
    }

    toast("Status Updated", `Case marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}.`, "success");
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
  }

  async function deleteRecord(record: DisciplinaryRecord) {
    if (!canManage) return;
    if (!confirm(`Move record "${record.title}" to the Recycle Bin? It can be restored later.`)) return;

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
  }

  const handleExportCSV = () => {
    const headers = ["Employee", "Department", "Role", "Case Title", "Type", "Severity", "Status", "Incident Date", "Follow Up Date", "Logged By", "Action Taken", "Resolution Date"];
    const rows = filtered.map((r) => [
      `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : ""}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.severity}"`,
      `"${r.status}"`,
      `"${r.incident_date || ""}"`,
      `"${r.follow_up_date || ""}"`,
      `"${r.created_by || ""}"`,
      `"${(r.action_taken || "").replace(/"/g, '""')}"`,
      `"${r.resolved_at || ""}"`,
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `disciplinary_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filtered.length} disciplinary records.`, "success");
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Employee Relations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Disciplinary &amp; PIP Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Disciplinary &amp; Incidents
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              {records.length} Cases
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {canManage
              ? "Track warnings, safety incidents, and performance improvement plans (PIPs) with follow-up milestones."
              : "View your warnings, incident reports, and performance improvement plans."}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export Records
          </button>

          {canManage && (
            <button
              onClick={() => {
                setNewRecord({
                  employee_id: "",
                  type: "verbal_warning",
                  title: "",
                  description: "",
                  severity: "medium",
                  status: "open",
                  incident_date: new Date().toISOString().split("T")[0],
                  follow_up_date: "",
                  witnesses: "",
                  action_taken: "",
                  pip_start_date: "",
                  pip_end_date: "",
                  pip_goals: "",
                });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-alert-line text-base font-bold" />
              Log Incident / PIP
            </button>
          )}
        </div>
      </div>

      {/* Overdue Follow-up Alert Banner */}
      {canManage && (() => {
        const overdueCount = records.filter(isOverdueRecord).length;
        return overdueCount > 0 ? (
          <div
            onClick={() => { setActiveTab("open"); setPage(1); }}
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-rose-100/70 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <i className="ri-alarm-warning-line text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-rose-700">
                {overdueCount} Case{overdueCount > 1 ? "s" : ""} Have Overdue Follow-Up Dates
              </p>
              <p className="text-[11px] text-rose-600/80 mt-0.5">
                Immediate action required — these cases passed their follow-up milestone without resolution.
              </p>
            </div>
            <span className="text-[11px] font-bold text-rose-600 group-hover:text-rose-800 transition-colors whitespace-nowrap flex items-center gap-1">
              Review now <i className="ri-arrow-right-line" />
            </span>
          </div>
        ) : null;
      })()}

      {/* Executive Metric Cards */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Open & In Progress Cases */}
        <div
          onClick={() => {
            setActiveTab("open");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "open" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Active Open Cases</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <i className="ri-folder-open-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-800 mt-2">{openCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Under investigation &amp; review</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Active PIPs */}
        <div
          onClick={() => {
            setActiveTab("pip");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "pip" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active PIPs</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/5 text-[#253C7D] flex items-center justify-center">
              <i className="ri-focus-3-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{pipCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Improvement plans tracked</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]/50" />
        </div>

        {/* High / Critical Severities */}
        <div
          onClick={() => {
            setActiveTab("critical");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "critical" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">High / Critical</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-error-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{criticalCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">High severity incidents</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Resolved / Closed Cases */}
        <div
          onClick={() => {
            setActiveTab("resolved");
            setPage(1);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            activeTab === "resolved" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved &amp; Closed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{resolvedCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Successfully concluded</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Main Filter Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 mb-5 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Cases", count: records.length, icon: "ri-folder-line" },
          { id: "open", label: "Open & Active", count: openCount, icon: "ri-time-line", isAlert: openCount > 0 },
          { id: "pip", label: "Performance Plans (PIPs)", count: pipCount, icon: "ri-focus-3-line" },
          { id: "critical", label: "High / Critical Alerts", count: criticalCount, icon: "ri-fire-line", isAlert: criticalCount > 0 },
          { id: "resolved", label: "Resolved & Closed", count: resolvedCount, icon: "ri-checkbox-circle-line" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/60 hover:bg-gray-50"
              }`}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : tab.isAlert
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search cases by employee name, title, department, or keywords..."
            className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
          >
            <option value="">All Incident Types</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => {
              setFilterSeverity(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
          >
            <option value="">All Severities</option>
            {Object.entries(SEVERITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-grid-fill" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-table-line" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Records Display */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-file-shield-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Disciplinary Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No incident reports or PIP cases match your selected tab, severity filter, or search query.
          </p>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Log Incident / PIP
            </button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS STREAM GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pagedRecords.map((r) => {
            const typeCfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.verbal_warning;
            const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
            const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
            const emp = r.employees;
            const isSelected = selectedRecord?.id === r.id;
            const isOverdue =
              r.follow_up_date &&
              r.status !== "resolved" &&
              r.status !== "closed" &&
              new Date(r.follow_up_date + "T00:00:00") < new Date();

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecord(r)}
                className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  r.severity === "critical"
                    ? "border-rose-200/90 hover:border-rose-300"
                    : "border-gray-200/80 hover:border-gray-300"
                } ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
              >
                {/* Severity Left Highlight Stripe */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    r.severity === "critical"
                      ? "bg-rose-600"
                      : r.severity === "high"
                      ? "bg-rose-500"
                      : r.severity === "medium"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />

                <div>
                  {/* Top Bar: Badges + Overdue Flag */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color} flex items-center gap-1`}>
                        <i className={typeCfg.icon} />
                        {typeCfg.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${sevCfg.bg} ${sevCfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                        {sevCfg.label}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Incident Title */}
                  <h3 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm sm:text-[15px] leading-snug line-clamp-1 mb-1.5">
                    {r.title}
                  </h3>

                  {/* Employee Details Card */}
                  <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-gray-100 rounded-2xl mb-3">
                    {emp?.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-black shrink-0">
                        {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {emp?.role || "Staff"} · {emp?.department || "Department"}
                      </p>
                    </div>
                  </div>

                  {/* Description Excerpt */}
                  {r.description && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {r.description}
                    </p>
                  )}

                  {/* Overdue Alert Banner */}
                  {isOverdue && (
                    <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[11px] font-bold">
                      <i className="ri-alarm-warning-line text-xs shrink-0" />
                      <span className="truncate">Follow-up target date is overdue!</span>
                    </div>
                  )}

                  {/* PIP Progress Bar Preview */}
                  {r.type === "pip" && r.pip_start_date && r.pip_end_date && (
                    <div className="p-2.5 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-xl text-xs space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[10px] text-[#253C7D] font-bold">
                        <span>PIP Duration</span>
                        <span>{new Date(r.pip_end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      <div className="w-full bg-[#253C7D]/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#253C7D] h-full w-2/3 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Meta */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <i className="ri-calendar-line text-gray-400" />
                    <span>
                      {r.incident_date
                        ? new Date(r.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-gray-500">Logged by {r.created_by}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE AUDIT VIEW */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Case Title</th>
                  <th className="px-5 py-3.5">Incident Type</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Incident Date</th>
                  <th className="px-5 py-3.5">Follow-up</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedRecords.map((r) => {
                  const typeCfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.verbal_warning;
                  const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
                  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
                  const emp = r.employees;
                  const isOverdue =
                    r.follow_up_date &&
                    r.status !== "resolved" &&
                    r.status !== "closed" &&
                    new Date(r.follow_up_date + "T00:00:00") < new Date();

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {emp?.avatar_url ? (
                            <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-black shrink-0">
                              {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </p>
                            <p className="text-[10px] text-gray-400">{emp?.department}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 line-clamp-1 max-w-xs">{r.title}</p>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}>
                          <i className={typeCfg.icon} />
                          {typeCfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${sevCfg.bg} ${sevCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                          {sevCfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                        {r.incident_date
                          ? new Date(r.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {r.follow_up_date ? (
                          <span className={`text-[11px] font-bold ${isOverdue ? "text-rose-600" : "text-gray-700"}`}>
                            {new Date(r.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {isOverdue && " ⚠️"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect Case
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{pageStart}</span>–<span className="font-bold text-gray-900">{pageEnd}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> cases
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {[6, 9, 18, 36].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            {pageWindow(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    p === safePage ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: CASE INVESTIGATION & ACTIONS                                      */}
      {/* ========================================================================= */}
      {selectedRecord && (() => {
        const typeCfg = TYPE_CONFIG[selectedRecord.type] || TYPE_CONFIG.verbal_warning;
        const sevCfg = SEVERITY_CONFIG[selectedRecord.severity] || SEVERITY_CONFIG.medium;
        const statusCfg = STATUS_CONFIG[selectedRecord.status] || STATUS_CONFIG.open;
        const emp = selectedRecord.employees;
        const isOverdue =
          selectedRecord.follow_up_date &&
          selectedRecord.status !== "resolved" &&
          selectedRecord.status !== "closed" &&
          new Date(selectedRecord.follow_up_date + "T00:00:00") < new Date();

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedRecord(null)}
            />
            <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
              {/* Drawer Top Header */}
              <div>
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color} flex items-center gap-1`}>
                      <i className={typeCfg.icon} />
                      {typeCfg.label}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${sevCfg.bg} ${sevCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                      {sevCfg.label} Severity
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>

                {/* Status Bar */}
                <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Status:</span>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {selectedRecord.resolved_at && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill" />
                      Resolved {new Date(selectedRecord.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {/* Employee Profile Card */}
                {emp && (
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-gray-200/80 rounded-2xl">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-sm font-black shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-gray-900">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-500">{emp.role}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{emp.department}</p>
                    </div>
                  </div>
                )}

                {/* Case Title */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Case Title
                  </span>
                  <h3 className="text-base font-black text-gray-900">{selectedRecord.title}</h3>
                </div>

                {/* Incident Description */}
                {selectedRecord.description && (
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Incident Summary &amp; Statement:
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedRecord.description}
                    </p>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
                  {[
                    {
                      label: "Incident Date",
                      value: selectedRecord.incident_date
                        ? new Date(selectedRecord.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—",
                    },
                    {
                      label: "Follow-up Target Date",
                      value: (
                        <span className={isOverdue ? "text-rose-600 font-black flex items-center gap-1" : "font-bold text-gray-800"}>
                          {selectedRecord.follow_up_date
                            ? new Date(selectedRecord.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "None set"}
                          {isOverdue && " (Overdue)"}
                        </span>
                      ),
                    },
                    { label: "Logged By", value: selectedRecord.created_by },
                    {
                      label: "Filed On",
                      value: new Date(selectedRecord.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }),
                    },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 font-medium">{row.label}</span>
                      <span className="font-bold text-gray-800 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Witnesses & Action Taken */}
                {selectedRecord.witnesses && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Witnesses Present:
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium">
                      {selectedRecord.witnesses}
                    </p>
                  </div>
                )}

                {selectedRecord.action_taken && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Action Taken / Corrective Measures:
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-line">
                      {selectedRecord.action_taken}
                    </p>
                  </div>
                )}

                {/* Performance Improvement Plan (PIP) Block */}
                {selectedRecord.type === "pip" && (
                  <div className="border border-[#253C7D]/25 rounded-2xl p-4 bg-[#253C7D]/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-[#253C7D] uppercase tracking-wide flex items-center gap-1.5">
                        <i className="ri-focus-3-line" />
                        Performance Improvement Plan (PIP)
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#253C7D]/15">
                        <span className="text-[10px] text-[#253C7D]/60 font-bold block mb-0.5">Start Date</span>
                        <span className="font-extrabold text-[#253C7D]">
                          {selectedRecord.pip_start_date
                            ? new Date(selectedRecord.pip_start_date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#253C7D]/15">
                        <span className="text-[10px] text-[#253C7D]/60 font-bold block mb-0.5">End Date</span>
                        <span className="font-extrabold text-[#253C7D]">
                          {selectedRecord.pip_end_date
                            ? new Date(selectedRecord.pip_end_date + "T00:00:00").toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>

                    {selectedRecord.pip_goals && (
                      <div className="p-3 bg-white rounded-xl border border-[#253C7D]/15 space-y-1">
                        <span className="text-[10px] text-[#253C7D]/60 font-bold uppercase tracking-wider block">
                          Key Milestones &amp; Measurable Goals:
                        </span>
                        <p className="text-xs text-[#253C7D] leading-relaxed whitespace-pre-line">
                          {selectedRecord.pip_goals}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Bottom Actions Footer */}
              <div className="p-4 border-t border-gray-100 bg-white space-y-2.5 shrink-0">
                {canManage && selectedRecord.status !== "resolved" && selectedRecord.status !== "closed" && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Progress Workflow:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRecord.status !== "in_progress" && (
                        <button
                          onClick={() => updateStatus(selectedRecord.id, "in_progress")}
                          className="py-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {selectedRecord.status !== "escalated" && (
                        <button
                          onClick={() => updateStatus(selectedRecord.id, "escalated")}
                          className="py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Escalate Case
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(selectedRecord.id, "resolved")}
                        className="py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => updateStatus(selectedRecord.id, "closed")}
                        className="py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Close Case
                      </button>
                    </div>
                  </div>
                )}

                {canManage && (
                  <button
                    onClick={() => deleteRecord(selectedRecord)}
                    className="w-full py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <i className="ri-delete-bin-line" />
                    Move to Recycle Bin
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: LOG INCIDENT / PIP COMPOSER                                        */}
      {/* ========================================================================= */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
                  <i className="ri-file-shield-line" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    Log Disciplinary Record / PIP
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Document a warning, policy violation, workplace incident, or performance plan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Employee Selector */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <EmployeeSearchSelect
                  employees={employees}
                  value={newRecord.employee_id}
                  onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
                />
              </div>

              {/* Case Type Cards */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Incident Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                    const isSelected = newRecord.type === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setNewRecord({ ...newRecord, type: k })}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${v.bg} ${v.color} border-current ring-2 ring-current/20 shadow-xs scale-[1.02]`
                            : "bg-white border-gray-200/80 text-gray-700 hover:bg-slate-50"
                        }`}
                      >
                        <i className={`${v.icon} text-base mb-1`} />
                        <p className="text-xs font-bold truncate">{v.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity & Incident Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Severity Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(SEVERITY_CONFIG).map(([k, v]) => {
                      const isSelected = newRecord.severity === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setNewRecord({ ...newRecord, severity: k as any })}
                          className={`py-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? `${v.bg} ${v.color} border-current ring-2 ring-current/20 font-black shadow-xs`
                              : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                          }`}
                        >
                          {v.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Incident Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecord.incident_date}
                    onChange={(e) => setNewRecord({ ...newRecord, incident_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Case Title */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Case Headline Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  placeholder="e.g. Unexcused absence on shift Q3 / Code of conduct review"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Description Body */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Detailed Statement &amp; Facts
                </label>
                <textarea
                  rows={3}
                  value={newRecord.description}
                  onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                  placeholder="Provide objective documentation of what occurred, impact on operations..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed"
                />
              </div>

              {/* Follow-up & Witnesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Follow-Up Review Target Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.follow_up_date}
                    onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Witnesses Present
                  </label>
                  <input
                    type="text"
                    value={newRecord.witnesses}
                    onChange={(e) => setNewRecord({ ...newRecord, witnesses: e.target.value })}
                    placeholder="e.g. John Doe, Operations Lead"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Action Taken */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Action Taken / Next Steps
                </label>
                <textarea
                  rows={2}
                  value={newRecord.action_taken}
                  onChange={(e) => setNewRecord({ ...newRecord, action_taken: e.target.value })}
                  placeholder="Summary of corrective coaching or disciplinary decisions made..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* PIP Configuration Section (Expands if type === 'pip') */}
              {newRecord.type === "pip" && (
                <div className="border border-[#253C7D]/25 rounded-2xl p-4 bg-[#253C7D]/5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <i className="ri-focus-3-line text-[#253C7D] text-lg" />
                    <div>
                      <p className="text-xs font-black text-[#253C7D]">Performance Improvement Plan Details</p>
                      <p className="text-[10px] text-[#253C7D]/80">Establish measurable performance milestones</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                        PIP Start Date
                      </label>
                      <input
                        type="date"
                        value={newRecord.pip_start_date}
                        onChange={(e) => setNewRecord({ ...newRecord, pip_start_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                        PIP End / Review Date
                      </label>
                      <input
                        type="date"
                        value={newRecord.pip_end_date}
                        onChange={(e) => setNewRecord({ ...newRecord, pip_end_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                      Measurable Objectives &amp; Goals
                    </label>
                    <textarea
                      rows={3}
                      value={newRecord.pip_goals}
                      onChange={(e) => setNewRecord({ ...newRecord, pip_goals: e.target.value })}
                      placeholder="1. Maintain on-time arrival rate above 95%&#10;2. Complete weekly sprint deliverables&#10;3. Bi-weekly check-in with supervisor"
                      className="w-full px-3.5 py-2 text-xs text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D] leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 flex gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newRecord.employee_id || !newRecord.title.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <i className="ri-checkbox-circle-fill text-sm" />
                  <span>{saving ? "Filing Record..." : "Log Disciplinary Record"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}