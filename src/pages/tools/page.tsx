import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";

interface Tool {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
  avatar_url?: string | null;
}

interface ToolAssignment {
  id: number;
  tool_id: number;
  employee_id: string;
  assigned_at: string;
  revoked_at: string | null;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

interface ToolUsage {
  id: number;
  tool_id: number;
  employee_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
}

const TOOL_ROUTES: Record<string, string> = {
  "Time Tracker": "/attendance",
  "Document Generator": "/documents",
  "Performance Review Builder": "/performance",
  "Expense Submission": "/finance",
  "Meeting Scheduler": "/meeting-rooms",
  "Compliance Auditor": "/audit-log",
  "Feedback & Pulse Surveys": "/announcements",
  "Recruitment & Referral": "/hire",
};

const CATEGORY_STYLES: Record<
  string,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  // Tool categories are navigation labels, not states — eight competing hues
  // made the grid read as a toy box. They now share the brand accent and are
  // told apart by icon and label.
  Productivity: { label: "Productivity", icon: "ri-flashlight-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Documents: { label: "Documents", icon: "ri-file-text-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Reviews: { label: "Performance & Reviews", icon: "ri-star-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Finance: { label: "Finance & Payroll", icon: "ri-wallet-3-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Scheduling: { label: "Scheduling & Shift", icon: "ri-calendar-event-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Compliance: { label: "Legal & Compliance", icon: "ri-shield-check-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Feedback: { label: "Surveys & Feedback", icon: "ri-chat-smile-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Hiring: { label: "Talent & Hiring", icon: "ri-user-search-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
};

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  // Activity-feed entries are a log, not an alert stream — neutral chips keep
  // the feed readable and stop it competing with the page's real signals.
  login: { label: "Signed into Tool", icon: "ri-login-box-line", color: "text-slate-600 bg-slate-100" },
  track_hours: { label: "Logged Work Hours", icon: "ri-time-line", color: "text-slate-600 bg-slate-100" },
  generate_doc: { label: "Generated Document", icon: "ri-file-add-line", color: "text-slate-600 bg-slate-100" },
  create_review: { label: "Initiated Review", icon: "ri-star-smile-line", color: "text-slate-600 bg-slate-100" },
  submit_expense: { label: "Submitted Expense", icon: "ri-money-dollar-circle-line", color: "text-slate-600 bg-slate-100" },
  create_schedule: { label: "Published Schedule", icon: "ri-calendar-check-line", color: "text-slate-600 bg-slate-100" },
  run_audit: { label: "Executed Audit Scan", icon: "ri-shield-flash-line", color: "text-slate-600 bg-slate-100" },
  create_survey: { label: "Created Pulse Survey", icon: "ri-questionnaire-line", color: "text-slate-600 bg-slate-100" },
  submit_referral: { label: "Submitted Candidate", icon: "ri-user-shared-line", color: "text-slate-600 bg-slate-100" },
};

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function Tools() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [tab, setTab] = useState<"tools" | "access" | "activity">("tools");
  const [tools, setTools] = useState<Tool[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [usages, setUsages] = useState<ToolUsage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Selected Tool Drawer State
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [drawerTab, setDrawerTab] = useState<"members" | "activity">("members");
  const [drawerSearch, setDrawerSearch] = useState("");

  // Grant Access Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetTool, setAssignTargetTool] = useState<Tool | null>(null);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("All");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [toolsRes, empRes] = await Promise.all([
      supabase.from("tools").select("*").order("id"),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    const toolList = (toolsRes.data as Tool[]) || [];
    setTools(toolList);
    setEmployees((empRes.data as Employee[]) || []);

    if (toolList.length > 0) {
      const toolIds = toolList.map((t) => t.id);
      const [assignRes, usageRes] = await Promise.all([
        supabase
          .from("tool_assignments")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .in("tool_id", toolIds)
          .is("revoked_at", null),
        supabase
          .from("tool_usages")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .in("tool_id", toolIds)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      setAssignments((assignRes.data as unknown as ToolAssignment[]) || []);
      setUsages((usageRes.data as unknown as ToolUsage[]) || []);
    }
    setLoading(false);
  };

  // Reset drawer state when switching selected tool
  useEffect(() => {
    setDrawerSearch("");
    setDrawerTab("members");
  }, [selectedTool]);

  // Aggregate Metrics
  const activeTools = useMemo(() => tools.filter((t) => t.status === "active").length, [tools]);
  const totalAssignments = useMemo(() => assignments.length, [assignments]);
  const totalUsages = useMemo(() => usages.length, [usages]);
  const avgUsagePerTool = tools.length > 0 ? Math.round(totalUsages / tools.length) : 0;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => t.category && set.add(t.category));
    return ["All", ...Array.from(set)];
  }, [tools]);

  // Distinct Employee Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return ["All", ...Array.from(set).sort()];
  }, [employees]);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (t.name || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [tools, categoryFilter, searchQuery]);

  // Helpers
  const getAssignedCount = (toolId: number) =>
    assignments.filter((a) => a.tool_id === toolId).length;

  const getRecentUsage = (toolId: number) =>
    usages.filter((u) => u.tool_id === toolId).slice(0, 5);

  const openAssign = (tool: Tool) => {
    setAssignTargetTool(tool);
    setAssignEmployeeIds([]);
    setAssignSearch("");
    setAssignDeptFilter("All");
    setAssignModalOpen(true);
  };

  const handleGrantAccess = async () => {
    if (!assignTargetTool || assignEmployeeIds.length === 0 || saving || !canManage) return;
    setSaving(true);

    const alreadyAssigned = new Set(
      assignments.filter((a) => a.tool_id === assignTargetTool.id).map((a) => a.employee_id)
    );
    const newIds = assignEmployeeIds.filter((id) => !alreadyAssigned.has(id));

    if (newIds.length === 0) {
      toast("Already Assigned", "All selected staff already have active access.", "warning");
      setSaving(false);
      return;
    }

    const payload = newIds.map((empId) => ({
      tool_id: assignTargetTool.id,
      employee_id: empId,
    }));

    const { error } = await supabase.from("tool_assignments").insert(payload);
    setSaving(false);

    if (error) {
      toast("Error", error.message, "error");
      return;
    }

    toast(
      "Access Granted",
      `${newIds.length} employee${newIds.length === 1 ? "" : "s"} granted access to ${assignTargetTool.name}.`,
      "success"
    );

    logActivity({
      module: "tools",
      action: "created",
      entityType: "tool_assignment",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Granted access to ${assignTargetTool.name} for ${newIds.length} employee${
        newIds.length === 1 ? "" : "s"
      }`,
    });

    setAssignModalOpen(false);
    setAssignEmployeeIds([]);
    loadData();
  };

  const handleRevokeAccess = async (assignId: number) => {
    if (!canManage) return;
    const assignment = assignments.find((a) => a.id === assignId);
    const tool = tools.find((t) => t.id === assignment?.tool_id);

    const { error } = await supabase
      .from("tool_assignments")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", assignId);

    if (error) {
      toast("Error", error.message, "error");
      return;
    }

    toast("Access Revoked", "Tool permission has been successfully revoked.", "success");
    logActivity({
      module: "tools",
      action: "updated",
      entityType: "tool_assignment",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Revoked access to ${tool?.name ?? "a tool"} for ${
        assignment?.employees ? `${assignment.employees.first_name} ${assignment.employees.last_name}` : "an employee"
      }`,
    });

    setAssignments((prev) => prev.filter((a) => a.id !== assignId));
  };

  const handleExportCSV = () => {
    if (tab === "activity") {
      const headers = ["Timestamp", "Tool", "Action", "Staff Member", "Department", "Metadata"];
      const rows = usages.map((u) => {
        const tool = tools.find((t) => t.id === u.tool_id);
        const emp = u.employees;
        return [
          `"${u.created_at}"`,
          `"${tool?.name || ""}"`,
          `"${u.action}"`,
          `"${emp ? `${emp.first_name} ${emp.last_name}` : ""}"`,
          `"${emp?.department || ""}"`,
          `"${JSON.stringify(u.metadata || {}).replace(/"/g, '""')}"`,
        ];
      });
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const uri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", `tool_activity_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${usages.length} activity records.`, "success");
    } else {
      const headers = ["Tool Name", "Category", "Status", "Assigned Staff", "Department", "Granted Date"];
      const rows = assignments.map((a) => {
        const tool = tools.find((t) => t.id === a.tool_id);
        const emp = a.employees;
        return [
          `"${tool?.name || ""}"`,
          `"${tool?.category || ""}"`,
          `"${tool?.status || ""}"`,
          `"${emp ? `${emp.first_name} ${emp.last_name}` : ""}"`,
          `"${emp?.department || ""}"`,
          `"${a.assigned_at}"`,
        ];
      });
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const uri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", `tool_assignments_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${assignments.length} tool access records.`, "success");
    }
  };

  // Filtered employees for the Grant Access modal
  const modalFilteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (assignDeptFilter !== "All" && emp.department !== assignDeptFilter) return false;
      if (assignSearch.trim()) {
        const q = assignSearch.toLowerCase().trim();
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const role = (emp.role || "").toLowerCase();
        const dept = (emp.department || "").toLowerCase();
        if (!fullName.includes(q) && !role.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [employees, assignSearch, assignDeptFilter]);

  if (loading && tools.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading HR productivity tools...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Productivity & Utilities</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">HR Tools Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Workplace Tools & Utilities
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              8 Core Modules
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage tool access permissions, launch workspace utilities, track employee utilization, and audit activities.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export CSV
          </button>

          {canManage && (
            <button
              onClick={() => {
                if (tools.length > 0) openAssign(tools[0]);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-user-shared-line text-base font-bold" />
              Grant Tool Access
            </button>
          )}
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Active Tools */}
        <div
          onClick={() => {
            setTab("tools");
            setCategoryFilter("All");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "tools" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Tools</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-apps-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{activeTools}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{categories.length - 1} Categories</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Total Access Grants */}
        <div
          onClick={() => setTab("access")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "access" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Accesses</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-user-follow-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalAssignments}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active Staff Grants</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Usage Events */}
        <div
          onClick={() => setTab("activity")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "activity" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Usage Events</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-bar-chart-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{totalUsages}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Logged Operations</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]/100" />
        </div>

        {/* Avg Activity per Tool */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Avg Usage / Tool</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-line-chart-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{avgUsagePerTool}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Events per module</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTab("tools")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "tools"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-apps-line text-sm" />
            <span>Tools Directory</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "tools" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {tools.length}
            </span>
          </button>

          <button
            onClick={() => setTab("access")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "access"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-shield-user-line text-sm" />
            <span>Access Governance</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "access" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {assignments.length}
            </span>
          </button>

          <button
            onClick={() => setTab("activity")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "activity"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-history-line text-sm" />
            <span>Usage Activity Log</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "activity" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {usages.length}
            </span>
          </button>
        </div>

        {/* View mode toggle on Tools Directory */}
        {tab === "tools" && (
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 self-start md:self-auto">
            <button
              onClick={() => setViewMode("cards")}
              title="Cards Grid"
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. TOOLS DIRECTORY TAB                                                    */}
      {/* ========================================================================= */}
      {tab === "tools" && (
        <div className="space-y-6">
          {/* Quick Filters Bar & Category Pills */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tool name, category, feature..."
                  className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
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

              <span className="text-xs font-bold text-gray-400">
                Showing {filteredTools.length} of {tools.length} Tools
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
              {categories.map((c) => {
                const count = c === "All" ? tools.length : tools.filter((t) => t.category === c).length;
                const isSelected = categoryFilter === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#253C7D] text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>{c}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                        isSelected ? "bg-white/20 text-white" : "bg-white text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools Grid or Table View */}
          {filteredTools.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-apps-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No HR Tools Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No tools match your current category or search criteria.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredTools.map((t) => {
                const catCfg = CATEGORY_STYLES[t.category] || {
                  label: t.category,
                  icon: "ri-apps-line",
                  color: "text-slate-700",
                  bg: "bg-slate-50",
                  border: "border-slate-200",
                };
                const assignedCount = getAssignedCount(t.id);
                const recent = getRecentUsage(t.id);
                const toolRoute = TOOL_ROUTES[t.name];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTool(t)}
                    className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl ${catCfg.bg} ${catCfg.color} flex items-center justify-center text-2xl font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                        >
                          <i className={t.icon || "ri-apps-line"} />
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                            t.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-base mb-1">
                        {t.name}
                      </h4>

                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                        {t.description}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
                      >
                        <i className={catCfg.icon} />
                        {catCfg.label}
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <i className="ri-user-line text-xs" /> {assignedCount} Users
                        </span>
                        <span className="text-gray-400 font-medium flex items-center gap-1">
                          <i className="ri-history-line text-xs" /> {recent.length} Uses
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {canManage && (
                          <button
                            onClick={() => openAssign(t)}
                            className="flex-1 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            + Grant
                          </button>
                        )}
                        {toolRoute && (
                          <Link
                            to={toolRoute}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            title="Launch Tool"
                          >
                            <i className="ri-external-link-line" />
                            Open
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setTab("access");
                            setCategoryFilter(t.category);
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Manage Access"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Tool Name</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Active Users</th>
                      <th className="px-5 py-3.5">Recent Activity</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTools.map((t) => {
                      const catCfg = CATEGORY_STYLES[t.category] || {
                        label: t.category,
                        icon: "ri-apps-line",
                        color: "text-slate-700",
                        bg: "bg-slate-50",
                        border: "border-slate-200",
                      };
                      const assignedCount = getAssignedCount(t.id);
                      const recent = getRecentUsage(t.id);
                      const toolRoute = TOOL_ROUTES[t.name];

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTool(t)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl ${catCfg.bg} ${catCfg.color} flex items-center justify-center text-base font-bold shrink-0 shadow-2xs`}
                              >
                                <i className={t.icon || "ri-apps-line"} />
                              </div>
                              <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">
                                {t.name}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
                            >
                              <i className={catCfg.icon} />
                              {catCfg.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-xs truncate text-gray-500 font-medium">
                            {t.description}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                            {assignedCount} Staff
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-gray-600">
                            {recent.length} Uses
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                t.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              ● {t.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {toolRoute && (
                                <Link
                                  to={toolRoute}
                                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <i className="ri-external-link-line" />
                                  Open
                                </Link>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => openAssign(t)}
                                  className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                                >
                                  + Grant
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedTool(t)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Inspect Details"
                              >
                                <i className="ri-arrow-right-s-line text-base font-bold" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACCESS GOVERNANCE TAB                                                  */}
      {/* ========================================================================= */}
      {tab === "access" && (
        <div className="space-y-6">
          {/* Quick Filter for Access */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="relative w-full sm:w-72">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, role, tool name..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
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

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All Tool Categories" : c}
                  </option>
                ))}
              </select>

              {categoryFilter !== "All" && (
                <button
                  onClick={() => setCategoryFilter("All")}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Reset Filter"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Tool Access Accordion / Cards List */}
          <div className="space-y-4">
            {filteredTools.map((tool) => {
              const toolAssigns = assignments.filter((a) => {
                if (a.tool_id !== tool.id) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase().trim();
                  const empName = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.toLowerCase();
                  const role = (a.employees?.role || "").toLowerCase();
                  const dept = (a.employees?.department || "").toLowerCase();
                  const tname = tool.name.toLowerCase();
                  if (!empName.includes(q) && !role.includes(q) && !dept.includes(q) && !tname.includes(q)) {
                    return false;
                  }
                }
                return true;
              });

              if (searchQuery.trim() && toolAssigns.length === 0 && !tool.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return null;
              }

              const catCfg = CATEGORY_STYLES[tool.category] || {
                label: tool.category,
                icon: "ri-apps-line",
                color: "text-slate-700",
                bg: "bg-slate-50",
                border: "border-slate-200",
              };
              const toolRoute = TOOL_ROUTES[tool.name];

              return (
                <div
                  key={tool.id}
                  className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden"
                >
                  {/* Tool Access Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50/80 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl ${catCfg.bg} ${catCfg.color} flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs`}
                      >
                        <i className={tool.icon || "ri-apps-line"} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          {tool.name}
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-gray-100 text-gray-600">
                            {toolAssigns.length} Staff Granted
                          </span>
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {toolRoute && (
                        <Link
                          to={toolRoute}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-external-link-line" />
                          Launch App
                        </Link>
                      )}
                      {canManage && (
                        <button
                          onClick={() => openAssign(tool)}
                          className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          + Grant Access
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Granted Roster List */}
                  {toolAssigns.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No staff members currently assigned to this tool.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {toolAssigns.map((a) => {
                        const emp = a.employees;
                        return (
                          <div
                            key={a.id}
                            className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Link
                                to={`/employees/${a.employee_id}`}
                                className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs cursor-pointer"
                              >
                                {emp?.avatar_url ? (
                                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{initials(emp?.first_name, emp?.last_name)}</span>
                                )}
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  to={`/employees/${a.employee_id}`}
                                  className="font-extrabold text-gray-900 hover:text-[#253C7D] transition-colors text-xs sm:text-sm truncate block"
                                >
                                  {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                                </Link>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {emp?.role || "Staff"} · {emp?.department || "General"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-[11px] text-gray-400 hidden sm:inline">
                                Granted on{" "}
                                {new Date(a.assigned_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>

                              {canManage && (
                                <button
                                  onClick={() => handleRevokeAccess(a.id)}
                                  className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. USAGE & AUDIT ACTIVITY TAB                                             */}
      {/* ========================================================================= */}
      {tab === "activity" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Workplace Tool Usage Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time audit log of team interactions with HR utilities</p>
            </div>

            <span className="text-xs font-bold text-gray-400">
              {usages.length} Total Interaction Events
            </span>
          </div>

          {usages.length === 0 ? (
            <div className="text-center py-16">
              <i className="ri-history-line text-4xl text-gray-300 mb-3 block" />
              <p className="text-xs font-bold text-gray-500">No tool usage activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {usages.map((u) => {
                const tool = tools.find((t) => t.id === u.tool_id);
                const actCfg = ACTION_LABELS[u.action] || {
                  label: u.action,
                  icon: "ri-flashlight-line",
                  color: "text-slate-600 bg-slate-50",
                };
                const emp = u.employees;

                return (
                  <div
                    key={u.id}
                    className="p-4 sm:px-6 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl ${actCfg.color} flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs`}
                      >
                        <i className={actCfg.icon} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-extrabold text-gray-900 text-xs sm:text-sm">
                            {actCfg.label}
                          </p>
                          <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-[#253C7D]/10 text-[#253C7D]">
                            {tool?.name || "Utility"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-0.5">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "System User"}
                          {emp?.department && <span className="text-gray-400"> · {emp.department}</span>}
                          {u.metadata && Object.keys(u.metadata).length > 0 && (
                            <span className="text-gray-400 text-[11px] ml-1">
                              ({Object.entries(u.metadata)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(", ")})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: HIGH PRODUCTIVITY TOOL DETAILS & ROSTER                           */}
      {/* ========================================================================= */}
      {selectedTool && (() => {
        const toolAssigns = assignments.filter((a) => {
          if (a.tool_id !== selectedTool.id) return false;
          if (drawerSearch.trim()) {
            const q = drawerSearch.toLowerCase().trim();
            const name = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.toLowerCase();
            const role = (a.employees?.role || "").toLowerCase();
            const dept = (a.employees?.department || "").toLowerCase();
            if (!name.includes(q) && !role.includes(q) && !dept.includes(q)) return false;
          }
          return true;
        });

        const toolUsagesList = usages.filter((u) => u.tool_id === selectedTool.id);
        const toolRoute = TOOL_ROUTES[selectedTool.name];
        const catCfg = CATEGORY_STYLES[selectedTool.category] || {
          label: selectedTool.category,
          icon: "ri-apps-line",
          color: "text-slate-700",
          bg: "bg-slate-50",
          border: "border-slate-200",
        };

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedTool(null)}
            />
            <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl ${catCfg.bg} ${catCfg.color} flex items-center justify-center text-xl font-bold shrink-0 shadow-2xs`}>
                    <i className={selectedTool.icon || "ri-apps-line"} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-gray-900 truncate">{selectedTool.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${selectedTool.status === "active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {selectedTool.category} · {selectedTool.status}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {toolRoute && (
                    <Link
                      to={toolRoute}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <i className="ri-external-link-line" />
                      Open
                    </Link>
                  )}
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>
              </div>

              {/* Drawer Middle Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Description Box */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                  {selectedTool.description}
                </div>

                {/* Sub-tabs inside Drawer */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setDrawerTab("members")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      drawerTab === "members"
                        ? "bg-white text-[#253C7D] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-team-line" />
                    <span>Granted Staff ({assignments.filter((a) => a.tool_id === selectedTool.id).length})</span>
                  </button>

                  <button
                    onClick={() => setDrawerTab("activity")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      drawerTab === "activity"
                        ? "bg-white text-[#253C7D] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-history-line" />
                    <span>Recent Uses ({toolUsagesList.length})</span>
                  </button>
                </div>

                {/* Tab: Granted Members */}
                {drawerTab === "members" && (
                  <div className="space-y-3">
                    {/* Live Search inside drawer */}
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        value={drawerSearch}
                        onChange={(e) => setDrawerSearch(e.target.value)}
                        placeholder="Search granted staff by name, role, dept..."
                        className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
                      />
                      {drawerSearch && (
                        <button
                          onClick={() => setDrawerSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className="ri-close-circle-fill text-xs" />
                        </button>
                      )}
                    </div>

                    {/* Member Rows */}
                    {toolAssigns.length === 0 ? (
                      <div className="text-center py-10 text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-100">
                        {drawerSearch ? "No matching staff found" : "No staff granted access yet"}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {toolAssigns.map((a) => {
                          const emp = a.employees;
                          return (
                            <div
                              key={a.id}
                              className="p-2.5 bg-gray-50/80 hover:bg-slate-100 rounded-2xl border border-gray-100/80 flex items-center justify-between transition-colors group"
                            >
                              <Link
                                to={`/employees/${a.employee_id}`}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                                  {emp?.avatar_url ? (
                                    <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{initials(emp?.first_name, emp?.last_name)}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors text-xs truncate">
                                    {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {emp?.role || "Staff"} · <span className="font-semibold text-gray-500">{emp?.department || "General"}</span>
                                  </p>
                                </div>
                              </Link>

                              {canManage && (
                                <button
                                  onClick={() => handleRevokeAccess(a.id)}
                                  className="text-[11px] font-bold px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-gray-200 hover:border-rose-200 transition-colors shrink-0 cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Recent Usage History */}
                {drawerTab === "activity" && (
                  <div className="space-y-2">
                    {toolUsagesList.length === 0 ? (
                      <div className="text-center py-10 text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-gray-100">
                        No activity events recorded for this tool yet.
                      </div>
                    ) : (
                      toolUsagesList.map((u) => {
                        const actCfg = ACTION_LABELS[u.action] || {
                          label: u.action,
                          icon: "ri-flashlight-line",
                          color: "text-slate-600 bg-slate-50",
                        };
                        const emp = u.employees;

                        return (
                          <div
                            key={u.id}
                            className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                <i className={`${actCfg.icon} text-xs text-[#253C7D]`} />
                                {actCfg.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {new Date(u.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <p className="text-[11px] text-gray-500">
                              By <span className="font-bold text-gray-800">{emp ? `${emp.first_name} ${emp.last_name}` : "User"}</span> ({emp?.department || "General"})
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Bottom Action Bar (Fixed Sticky Footer) */}
              <div className="p-4 border-t border-gray-100 bg-white flex gap-2 shrink-0">
                {toolRoute && (
                  <Link
                    to={toolRoute}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-external-link-line text-sm" />
                    Launch App
                  </Link>
                )}
                {canManage && (
                  <button
                    onClick={() => {
                      openAssign(selectedTool);
                      setSelectedTool(null);
                    }}
                    className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <i className="ri-user-add-line text-sm" />
                    + Grant Staff Access
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: REDESIGNED PRODUCTIVE BATCH ACCESS GRANT MODAL                      */}
      {/* ========================================================================= */}
      {assignModalOpen && assignTargetTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setAssignModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
                  <i className={assignTargetTool.icon || "ri-shield-user-line"} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900">Grant Tool Access</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Assign access permissions to <strong className="text-gray-700">{assignTargetTool.name}</strong> ({assignTargetTool.category})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAssignModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Search & Department Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  <input
                    type="text"
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    placeholder="Search employee by name, role, department..."
                    className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                  {assignSearch && (
                    <button
                      onClick={() => setAssignSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className="ri-close-circle-fill text-xs" />
                    </button>
                  )}
                </div>

                <select
                  value={assignDeptFilter}
                  onChange={(e) => setAssignDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer sm:w-44"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === "All" ? "All Departments" : d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Summary & Quick Select All Toolbar */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-gray-200/60">
                <span className="font-semibold text-gray-600">
                  Showing <strong className="text-gray-900">{modalFilteredEmployees.length}</strong> matching staff · <strong className="text-[#253C7D]">{assignEmployeeIds.length}</strong> selected
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const matchingIds = modalFilteredEmployees.map((e) => e.id);
                      const allSelected = matchingIds.length > 0 && matchingIds.every((id) => assignEmployeeIds.includes(id));
                      if (allSelected) {
                        setAssignEmployeeIds((prev) => prev.filter((id) => !matchingIds.includes(id)));
                      } else {
                        setAssignEmployeeIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
                      }
                    }}
                    className="text-[11px] font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-checkbox-multiple-line" />
                    {modalFilteredEmployees.length > 0 && modalFilteredEmployees.every((e) => assignEmployeeIds.includes(e.id))
                      ? "Deselect All Filtered"
                      : `Select All (${modalFilteredEmployees.length})`}
                  </button>

                  {assignEmployeeIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAssignEmployeeIds([])}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Staff Tags Strip */}
              {assignEmployeeIds.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Selected Staff Members ({assignEmployeeIds.length}):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto p-1 bg-white border border-gray-100 rounded-xl">
                    {assignEmployeeIds.map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 bg-[#253C7D]/10 text-[#253C7D] rounded-lg text-xs font-bold"
                        >
                          <span>{emp ? `${emp.first_name} ${emp.last_name}` : id}</span>
                          <button
                            type="button"
                            onClick={() => setAssignEmployeeIds((prev) => prev.filter((i) => i !== id))}
                            className="w-4 h-4 rounded hover:bg-[#253C7D]/20 flex items-center justify-center cursor-pointer"
                          >
                            <i className="ri-close-line text-xs" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Embedded Multi-Select Staff Roster */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white max-h-72 overflow-y-auto divide-y divide-gray-100">
                {modalFilteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No employees match your search or department filter.
                  </div>
                ) : (
                  modalFilteredEmployees.map((emp) => {
                    const isChecked = assignEmployeeIds.includes(emp.id);
                    const isAlreadyAssigned = assignments.some(
                      (a) => a.tool_id === assignTargetTool.id && a.employee_id === emp.id
                    );

                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setAssignEmployeeIds((prev) =>
                            prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                          );
                        }}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isChecked ? "bg-[#253C7D]/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-[#253C7D] border-[#253C7D] text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isChecked && <i className="ri-check-line text-xs font-bold" />}
                          </span>

                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp.first_name, emp.last_name)}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-xs truncate">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {emp.role || "Staff"} · <span className="font-semibold text-gray-500">{emp.department || "General"}</span>
                            </p>
                          </div>
                        </div>

                        {isAlreadyAssigned && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            ● Active Access
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Sticky Bottom Action Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantAccess}
                disabled={saving || assignEmployeeIds.length === 0}
                className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {saving
                  ? "Granting..."
                  : assignEmployeeIds.length > 0
                  ? `Grant Access (${assignEmployeeIds.length} Staff)`
                  : "Select Staff to Grant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}