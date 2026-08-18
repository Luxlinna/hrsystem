import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface Offboarding {
  id: string;
  employee_id: string;
  last_day: string;
  reason: string;
  status: string;
  created_at: string;
  notes?: string | null;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department?: string;
    branch_id?: string;
    avatar_url?: string | null;
    branches?: { id: string; name: string } | null;
  } | null;
  tasks?: OffboardingTask[];
}

interface OffboardingTask {
  id: string;
  offboarding_id: string;
  title: string;
  type: string;
  assignee: string;
  status: string;
  due_date: string | null;
  notes?: string | null;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  avatar_url?: string | null;
}

interface Branch {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string; hex: string }
> = {
  notice_period: {
    label: "Notice Period",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
    hex: "#F59E0B",
  },
  exit_interview: {
    label: "Exit Interview",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-chat-voice-line",
    hex: "#0284C7",
  },
  clearance: {
    label: "Clearance & Handover",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "ri-shield-check-line",
    hex: "#9333EA",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
    hex: "#10B981",
  },
};

const STAGE_ORDER = ["notice_period", "exit_interview", "clearance", "completed"];

const TASK_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  IT: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/80", icon: "ri-macbook-line" },
  HR: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/80", icon: "ri-user-shared-line" },
  Finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/80", icon: "ri-money-dollar-circle-line" },
  Operations: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/80", icon: "ri-building-line" },
};

const DEFAULT_EXIT_TASKS = [
  { title: "Return company laptop & IT hardware", type: "IT", assignee: "IT Team" },
  { title: "Conduct exit interview & feedback survey", type: "HR", assignee: "HR Manager" },
  { title: "Process final paycheck & calculate leave encashment", type: "Finance", assignee: "Payroll Dept" },
  { title: "Revoke corporate email, Slack, and VPN access", type: "IT", assignee: "IT Security" },
  { title: "Handover company keys & security access badge", type: "Operations", assignee: "Facility / Admin" },
];

const EXIT_REASONS = [
  "Career Advancement / New Offer",
  "Relocation / Personal Reasons",
  "Career Break / Higher Education",
  "Retirement",
  "Health or Family Commitments",
  "Contract Expiration",
  "Involuntary Departure / Restructuring",
  "Other",
];

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

const formatRelativeDays = (dateStr: string) => {
  if (!dateStr) return "—";
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Last day is Today";
  if (diffDays === 1) return "Last day is Tomorrow";
  if (diffDays > 1) return `${diffDays} days remaining`;
  if (diffDays === -1) return "Departed yesterday";
  return `Departed ${Math.abs(diffDays)} days ago`;
};

export default function Offboard() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [tab, setTab] = useState<"active" | "completed" | "tasks" | "analytics">("active");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTaskType, setFilterTaskType] = useState("all");

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState({
    employee_id: "",
    last_day: "",
    reason: EXIT_REASONS[0],
    notes: "",
    includeDefaultTasks: true,
  });

  // Add Task Modal
  const [taskModal, setTaskModal] = useState<{ open: boolean; offboardingId: string | null }>({
    open: false,
    offboardingId: null,
  });
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    type: "IT",
    assignee: "IT Team",
    due_date: "",
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  // Edit Offboarding Modal
  const [editingOffboarding, setEditingOffboarding] = useState<Offboarding | null>(null);
  const [editForm, setEditForm] = useState({
    last_day: "",
    reason: "",
    notes: "",
    status: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!highlightId || offboardings.length === 0) return;
    const match = offboardings.find((o) => o.id === highlightId);
    if (!match) return;
    setTab(match.status === "completed" ? "completed" : "active");
    const t = setTimeout(() => {
      const el = document.getElementById(`offboarding-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, offboardings]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: off }, { data: emps }, { data: brs }] = await Promise.all([
      supabase
        .from("offboarding_requests")
        .select("*, employees(first_name, last_name, role, department, branch_id, avatar_url, branches(id, name))")
        .order("last_day", { ascending: true }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url")
        .eq("status", "active")
        .order("first_name"),
      supabase
        .from("branches")
        .select("id, name")
        .order("name"),
    ]);

    if (off) {
      const withTasks = await Promise.all(
        off.map(async (o) => {
          const { data: t } = await supabase
            .from("offboarding_tasks")
            .select("*")
            .eq("offboarding_id", o.id)
            .order("created_at");
          return { ...o, tasks: t || [] };
        })
      );
      setOffboardings(withTasks);
    }

    setEmployees(emps || []);
    setBranches(brs || []);
    setLoading(false);
  };

  // Departments for filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    offboardings.forEach((o) => {
      if (o.employees?.department) set.add(o.employees.department);
    });
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [offboardings, employees]);

  // Filtered collections
  const activeOffboardings = useMemo(
    () => offboardings.filter((o) => o.status !== "completed"),
    [offboardings]
  );
  const completedOffboardings = useMemo(
    () => offboardings.filter((o) => o.status === "completed"),
    [offboardings]
  );

  const filteredOffboardings = useMemo(() => {
    const list = tab === "completed" ? completedOffboardings : activeOffboardings;
    return list.filter((o) => {
      if (filterDepartment !== "all" && o.employees?.department !== filterDepartment) return false;
      if (filterBranch !== "all" && o.employees?.branch_id !== filterBranch) return false;
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`.toLowerCase();
        const roleName = (o.employees?.role || "").toLowerCase();
        const deptName = (o.employees?.department || "").toLowerCase();
        const reason = (o.reason || "").toLowerCase();
        const matchTasks = (o.tasks || []).some((t) => t.title.toLowerCase().includes(q));
        if (!empName.includes(q) && !roleName.includes(q) && !deptName.includes(q) && !reason.includes(q) && !matchTasks) {
          return false;
        }
      }
      return true;
    });
  }, [tab, activeOffboardings, completedOffboardings, filterDepartment, filterBranch, filterStatus, searchQuery]);

  const allTasks = useMemo(() => {
    return offboardings.flatMap((o) =>
      (o.tasks || []).map((t) => ({
        ...t,
        offboardingStatus: o.status,
        employeeName: `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`,
        employeeRole: o.employees?.role || "Team Member",
        employeeDept: o.employees?.department || "General",
        employeeAvatar: o.employees?.avatar_url,
        last_day: o.last_day,
      }))
    );
  }, [offboardings]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (filterTaskType !== "all" && t.type !== filterTaskType) return false;
      if (filterDepartment !== "all" && t.employeeDept !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = t.title.toLowerCase().includes(q);
        const empMatch = t.employeeName.toLowerCase().includes(q);
        const assigneeMatch = t.assignee.toLowerCase().includes(q);
        if (!titleMatch && !empMatch && !assigneeMatch) return false;
      }
      return true;
    });
  }, [allTasks, filterTaskType, filterDepartment, searchQuery]);

  // Metrics
  const totalActiveCount = activeOffboardings.length;
  const inClearanceCount = activeOffboardings.filter((o) => o.status === "clearance").length;
  const totalCompletedCount = completedOffboardings.length;
  const pendingTasksCount = allTasks.filter((t) => t.status === "pending").length;
  const overdueTasksCount = allTasks.filter(
    (t) => t.status === "pending" && t.due_date && new Date(t.due_date + "T00:00:00") < new Date()
  ).length;

  // Analytics Chart Data
  const reasonChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    offboardings.forEach((o) => {
      const r = o.reason || "Unspecified";
      counts[r] = (counts[r] || 0) + 1;
    });
    const colors = ["#253C7D", "#0284C7", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#64748B"];
    return Object.entries(counts).map(([reason, count], idx) => ({
      name: reason,
      value: count,
      fill: colors[idx % colors.length],
    }));
  }, [offboardings]);

  const deptChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    offboardings.forEach((o) => {
      const d = o.employees?.department || "General";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([department, count]) => ({
      department,
      count,
    }));
  }, [offboardings]);

  // Actions
  const toggleTask = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("offboarding_tasks").update({ status: next }).eq("id", taskId);
    if (error) { toast("Error", "Failed to update task", "error"); return; }
    toast(next === "completed" ? "Task Completed" : "Task Reopened", "", "success");
    loadData();
  };

  const updateOffboardingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("offboarding_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast("Error", "Failed to update status", "error"); return; }
    toast("Status Updated", STATUS_CONFIG[status]?.label || status, "success");
    const record = offboardings.find((o) => o.id === id);
    const empName = record?.employees
      ? `${record.employees.first_name} ${record.employees.last_name}`
      : "an employee";

    logActivity({
      module: "offboard",
      action: status === "completed" ? "processed" : "updated",
      entityType: "offboarding_request",
      entityId: id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Offboarding for ${empName} moved to ${STATUS_CONFIG[status]?.label || status}`,
    });

    if (status === "completed") {
      notify({
        source: "offboard",
        type: "info",
        title: "Offboarding completed",
        message: `${empName}'s exit process is complete.`,
        entityId: id,
      });
    }
    loadData();
  };

  const deleteOffboarding = async (id: string, empName: string) => {
    if (!confirm(`Move offboarding record for "${empName}" to Recycle Bin?`)) return;
    const { error } = await supabase
      .from("offboarding_requests")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete offboarding record", "error"); return; }
    toast("Offboarding Deleted", "Record moved to Recycle Bin.", "success");
    loadData();
  };

  const createOffboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.employee_id || !newForm.last_day || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("offboarding_requests")
      .insert([
        {
          employee_id: newForm.employee_id,
          last_day: newForm.last_day,
          reason: newForm.reason,
          notes: newForm.notes.trim(),
          status: "notice_period",
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast("Error", "Failed to start offboarding", "error");
      return;
    }

    if (newForm.includeDefaultTasks) {
      const taskInserts = DEFAULT_EXIT_TASKS.map((t) => ({
        offboarding_id: data.id,
        title: t.title,
        type: t.type,
        assignee: t.assignee,
        status: "pending",
        due_date: newForm.last_day,
      }));
      await supabase.from("offboarding_tasks").insert(taskInserts);
    }

    setSubmitting(false);
    setCreateModal(false);
    const emp = employees.find((e) => e.id === newForm.employee_id);
    setNewForm({
      employee_id: "",
      last_day: "",
      reason: EXIT_REASONS[0],
      notes: "",
      includeDefaultTasks: true,
    });
    toast("Offboarding Started", "Employee exit workflow initiated.", "success");
    logActivity({
      module: "offboard",
      action: "created",
      entityType: "offboarding_request",
      entityId: data.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Offboarding started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}`,
    });
    notify({
      source: "offboard",
      type: "warning",
      title: "Offboarding started",
      message: `Exit process started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}, last day ${newForm.last_day}.`,
      entityId: data.id,
    });
    loadData();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskModal.offboardingId || !newTaskForm.title.trim() || submittingTask) return;
    setSubmittingTask(true);

    const { error } = await supabase.from("offboarding_tasks").insert([
      {
        offboarding_id: taskModal.offboardingId,
        title: newTaskForm.title.trim(),
        type: newTaskForm.type,
        assignee: newTaskForm.assignee.trim(),
        due_date: newTaskForm.due_date || null,
        status: "pending",
      },
    ]);

    setSubmittingTask(false);
    if (error) { toast("Error", "Failed to add task", "error"); return; }
    toast("Task Added", "Exit checklist task added successfully.", "success");
    setTaskModal({ open: false, offboardingId: null });
    setNewTaskForm({ title: "", type: "IT", assignee: "IT Team", due_date: "" });
    loadData();
  };

  const openEditModal = (o: Offboarding) => {
    setEditingOffboarding(o);
    setEditForm({
      last_day: o.last_day ? o.last_day.slice(0, 10) : "",
      reason: o.reason || EXIT_REASONS[0],
      notes: o.notes || "",
      status: o.status || "notice_period",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffboarding || savingEdit) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from("offboarding_requests")
      .update({
        last_day: editForm.last_day,
        reason: editForm.reason,
        notes: editForm.notes.trim(),
        status: editForm.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingOffboarding.id);

    setSavingEdit(false);
    if (error) { toast("Error", "Failed to update record", "error"); return; }
    toast("Offboarding Updated", "Changes saved successfully.", "success");
    setEditingOffboarding(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading offboarding dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Employee Lifecycle</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Departure Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Offboarding & Exit Operations
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Lifecycle Management
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Coordinate employee departures, track multi-departmental clearances, handover assets, and record exit interviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-user-unfollow-line text-base font-bold" />
            Start Offboarding
          </button>
        </div>
      </div>

      {/* Executive KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {/* Active Offboardings */}
        <div
          onClick={() => { setTab("active"); setFilterStatus("all"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "active" && filterStatus === "all" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Active Departures</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-user-shared-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{totalActiveCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{inClearanceCount} in final clearance</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Clearance In Progress */}
        <div
          onClick={() => { setTab("active"); setFilterStatus("clearance"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "active" && filterStatus === "clearance" ? "border-purple-600 ring-2 ring-purple-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Clearance Phase</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <i className="ri-shield-check-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{inClearanceCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Asset return & sign-offs</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* Completed Departures */}
        <div
          onClick={() => { setTab("completed"); setFilterStatus("all"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "completed" ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed Exits</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalCompletedCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Departures finalized</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Pending & Overdue Tasks */}
        <div
          onClick={() => setTab("tasks")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "tasks" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-task-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{pendingTasksCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {overdueTasksCount > 0 ? (
              <span className="text-rose-600 font-bold">{overdueTasksCount} overdue tasks</span>
            ) : (
              "All tasks on track"
            )}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Control Bar: Tabs, Search, and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setTab("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "active" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-user-shared-line text-sm" />
              <span>Active Departures</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "active" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {activeOffboardings.length}
              </span>
            </button>

            <button
              onClick={() => setTab("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "completed" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-checkbox-circle-line text-sm" />
              <span>Completed Exits</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "completed" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {completedOffboardings.length}
              </span>
            </button>

            <button
              onClick={() => setTab("tasks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "tasks" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check-2 text-sm" />
              <span>Exit Task Matrix</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "tasks" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {allTasks.length}
              </span>
            </button>

            <button
              onClick={() => setTab("analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "analytics" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-pie-chart-line text-sm" />
              <span>Turnover Analytics</span>
            </button>
          </div>
        </div>

        {/* Search, Dropdowns & View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Search */}
          <div className="relative w-full sm:w-60">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, task, reason..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
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

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[140px] truncate font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Task Type Filter (when in Task Tab) */}
          {tab === "tasks" && (
            <select
              value={filterTaskType}
              onChange={(e) => setFilterTaskType(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
            >
              <option value="all">All Task Types</option>
              <option value="IT">IT & Access</option>
              <option value="HR">HR & Interviews</option>
              <option value="Finance">Finance & Payroll</option>
              <option value="Operations">Operations / Admin</option>
            </select>
          )}

          {/* View Mode Toggle (for Active / Completed) */}
          {(tab === "active" || tab === "completed") && (
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
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-table-line" />
              </button>
            </div>
          )}

          {/* Reset Filters */}
          {(searchQuery || filterDepartment !== "all" || filterBranch !== "all" || filterStatus !== "all" || filterTaskType !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterDepartment("all");
                setFilterBranch("all");
                setFilterStatus("all");
                setFilterTaskType("all");
              }}
              title="Reset all filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1 & 2. ACTIVE / COMPLETED OFFBOARDINGS                                    */}
      {/* ========================================================================= */}
      {(tab === "active" || tab === "completed") && (
        <div>
          {filteredOffboardings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-checkbox-circle-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {tab === "active" ? "No Active Offboardings" : "No Completed Departures"}
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {tab === "active"
                  ? "There are currently no active employee exit processes in progress."
                  : "Completed employee departure records will appear here."}
              </p>
              {tab === "active" && (
                <button
                  onClick={() => setCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
                >
                  + Start First Offboarding
                </button>
              )}
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredOffboardings.map((o) => {
                const doneCount = o.tasks?.filter((t) => t.status === "completed").length || 0;
                const totalTasks = o.tasks?.length || 0;
                const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
                const statusMeta = STATUS_CONFIG[o.status] || STATUS_CONFIG.notice_period;
                const isHighlight = o.id === highlightId;

                return (
                  <div
                    key={o.id}
                    id={`offboarding-${o.id}`}
                    tabIndex={-1}
                    className={`bg-white rounded-3xl border p-5 md:p-6 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between group outline-none ${
                      isHighlight
                        ? "border-[#253C7D] ring-4 ring-[#253C7D]/15"
                        : "border-gray-200/80 hover:border-[#253C7D]/30"
                    }`}
                  >
                    <div>
                      {/* Top Header: Employee & Departure Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                            {initials(o.employees?.first_name, o.employees?.last_name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                to={`/employees/${o.employee_id}`}
                                className="text-base font-extrabold text-gray-900 hover:text-[#253C7D] transition-colors truncate"
                              >
                                {o.employees?.first_name} {o.employees?.last_name}
                              </Link>
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                              >
                                ● {statusMeta.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                              <span className="font-semibold text-gray-700">{o.employees?.role || "Team Member"}</span>
                              {o.employees?.department && (
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.2 rounded-md font-semibold text-[11px]">
                                  {o.employees.department}
                                </span>
                              )}
                              {o.employees?.branches?.name && (
                                <span className="text-gray-400 flex items-center gap-1">
                                  <i className="ri-building-line" />
                                  {o.employees.branches.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date Pill & Status Selector */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <div className="text-right sm:text-right">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                              Last Working Day
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {new Date(`${o.last_day}T00:00:00`).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] font-medium text-amber-600 block">
                              {formatRelativeDays(o.last_day)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Stage Stepper */}
                      <div className="py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Departure Stage
                          </span>
                          <select
                            value={o.status}
                            onChange={(e) => updateOffboardingStatus(o.id, e.target.value)}
                            className="px-2.5 py-1 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                          >
                            {Object.entries(STATUS_CONFIG).map(([k, meta]) => (
                              <option key={k} value={k}>
                                Stage: {meta.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 mt-2">
                          {STAGE_ORDER.map((stageKey, idx) => {
                            const currentIdx = STAGE_ORDER.indexOf(o.status);
                            const isPast = currentIdx >= idx;
                            const isCurrent = o.status === stageKey;
                            const meta = STATUS_CONFIG[stageKey];

                            return (
                              <button
                                key={stageKey}
                                type="button"
                                onClick={() => updateOffboardingStatus(o.id, stageKey)}
                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                  isCurrent
                                    ? `${meta.bg} ${meta.border} ring-2 ring-[#253C7D]/10`
                                    : isPast
                                    ? "bg-slate-50 border-slate-200"
                                    : "bg-gray-50/50 border-gray-200/60 opacity-60 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                                    Step {idx + 1}
                                  </span>
                                  <i
                                    className={`${meta.icon} text-xs ${
                                      isCurrent || isPast ? meta.text : "text-gray-300"
                                    }`}
                                  />
                                </div>
                                <p className="text-[11px] font-bold text-gray-900 mt-0.5 truncate">
                                  {meta.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Checklist Progress Bar */}
                      <div className="py-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <i className="ri-task-line text-[#253C7D]" />
                            Exit Clearance Checklist
                          </span>
                          <span className="text-xs font-bold text-gray-600">
                            {doneCount} / {totalTasks} Completed ({progressPct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              progressPct === 100 ? "bg-emerald-500" : "bg-[#253C7D]"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        {/* Task Item Pills */}
                        <div className="space-y-2 mt-3.5">
                          {(o.tasks || []).map((t) => {
                            const isDone = t.status === "completed";
                            const typeStyle = TASK_TYPE_COLORS[t.type] || TASK_TYPE_COLORS.IT;

                            return (
                              <div
                                key={t.id}
                                onClick={() => toggleTask(t.id, t.status)}
                                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                  isDone
                                    ? "bg-emerald-50/40 border-emerald-200/70"
                                    : "bg-gray-50/70 border-gray-200/70 hover:bg-gray-100/70 hover:border-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                      isDone
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isDone && <i className="ri-check-line text-xs font-bold" />}
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`text-xs font-bold truncate ${
                                        isDone ? "line-through text-gray-400" : "text-gray-900"
                                      }`}
                                    >
                                      {t.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                      <span>Assignee: {t.assignee}</span>
                                      {t.due_date && (
                                        <span>
                                          · Due {new Date(`${t.due_date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shrink-0 ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                                >
                                  {t.type}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Exit Reason & Notes */}
                      {o.reason && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-gray-100 text-xs text-gray-600">
                          <span className="font-bold text-gray-800">Exit Reason: </span>
                          <span>{o.reason}</span>
                          {o.notes && <p className="mt-1 text-[11px] text-gray-500 italic">"{o.notes}"</p>}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Toolbar */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setTaskModal({ open: true, offboardingId: o.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-[#253C7D]/10 hover:text-[#253C7D] text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <i className="ri-add-line text-sm" />
                        Add Task
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(o)}
                          title="Edit Details"
                          className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line mr-1" />
                          Edit
                        </button>

                        {o.status !== "completed" ? (
                          <button
                            onClick={() => updateOffboardingStatus(o.id, "completed")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <i className="ri-checkbox-circle-line mr-1" />
                            Finalize Exit
                          </button>
                        ) : (
                          <button
                            onClick={() => updateOffboardingStatus(o.id, "clearance")}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteOffboarding(
                              o.id,
                              `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`
                            )
                          }
                          title="Move to Recycle Bin"
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / List View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Departing Employee</th>
                      <th className="px-5 py-3.5">Department & Branch</th>
                      <th className="px-5 py-3.5">Last Working Day</th>
                      <th className="px-5 py-3.5">Exit Reason</th>
                      <th className="px-5 py-3.5 text-center">Clearance Progress</th>
                      <th className="px-5 py-3.5">Stage</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOffboardings.map((o) => {
                      const doneCount = o.tasks?.filter((t) => t.status === "completed").length || 0;
                      const totalTasks = o.tasks?.length || 0;
                      const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
                      const statusMeta = STATUS_CONFIG[o.status] || STATUS_CONFIG.notice_period;

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {initials(o.employees?.first_name, o.employees?.last_name)}
                              </div>
                              <div>
                                <Link
                                  to={`/employees/${o.employee_id}`}
                                  className="font-bold text-gray-900 hover:text-[#253C7D] transition-colors"
                                >
                                  {o.employees?.first_name} {o.employees?.last_name}
                                </Link>
                                <p className="text-[11px] text-gray-400">{o.employees?.role || "Team Member"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {o.employees?.department || "General"}
                            </span>
                            <span className="text-gray-400 block text-[11px] mt-0.5">
                              {o.employees?.branches?.name || "Headquarters"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-bold text-gray-900">
                              {new Date(`${o.last_day}T00:00:00`).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] text-amber-600 block">
                              {formatRelativeDays(o.last_day)}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 max-w-[200px] truncate text-gray-600 font-medium">
                            {o.reason || "—"}
                          </td>

                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="font-bold text-gray-800 text-[11px]">
                                {doneCount}/{totalTasks} ({progressPct}%)
                              </span>
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full ${progressPct === 100 ? "bg-emerald-500" : "bg-[#253C7D]"}`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                            >
                              ● {statusMeta.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(o)}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setTaskModal({ open: true, offboardingId: o.id })}
                                className="px-2.5 py-1 text-xs font-semibold text-[#253C7D] hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                              >
                                + Task
                              </button>
                              <button
                                onClick={() =>
                                  deleteOffboarding(
                                    o.id,
                                    `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`
                                  )
                                }
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                              >
                                <i className="ri-delete-bin-line" />
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
      {/* 3. EXIT TASK MATRIX TAB                                                   */}
      {/* ========================================================================= */}
      {tab === "tasks" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-list-check-2 text-[#253C7D]" />
                Exit Clearance Tasks & Ownership
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Multi-department clearance checklist across all departing team members
              </p>
            </div>

            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
              {filteredTasks.filter((t) => t.status === "completed").length} / {filteredTasks.length} Completed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Task Description</th>
                  <th className="px-5 py-3.5">Department / Category</th>
                  <th className="px-5 py-3.5">Departing Employee</th>
                  <th className="px-5 py-3.5">Responsible Assignee</th>
                  <th className="px-5 py-3.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-xs">
                      No clearance tasks match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isDone = t.status === "completed";
                    const isOverdue = !isDone && t.due_date && new Date(t.due_date + "T00:00:00") < new Date();
                    const typeStyle = TASK_TYPE_COLORS[t.type] || TASK_TYPE_COLORS.IT;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleTask(t.id, t.status)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "border-gray-300 bg-white hover:border-[#253C7D]"
                            }`}
                          >
                            {isDone && <i className="ri-check-line text-sm font-bold" />}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          <p className={`font-bold text-sm ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                            {t.title}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                          >
                            {t.type}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-bold text-gray-900">{t.employeeName}</p>
                          <p className="text-[11px] text-gray-400">{t.employeeRole}</p>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                          {t.assignee}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {t.due_date ? (
                            <span className={isOverdue ? "text-rose-600 font-bold" : "text-gray-700 font-medium"}>
                              {new Date(`${t.due_date}T00:00:00`).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                              {isOverdue && " (Overdue)"}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TURNOVER & EXIT ANALYTICS TAB                                          */}
      {/* ========================================================================= */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reason Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
              <i className="ri-pie-chart-line text-[#253C7D]" />
              Departure Reasons Breakdown
            </h3>
            <p className="text-xs text-gray-400 mb-4">Distribution of stated departure reasons</p>

            {reasonChartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">No departure records to analyze</div>
            )}
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1">
              <i className="ri-bar-chart-box-line text-[#253C7D]" />
              Turnover by Department
            </h3>
            <p className="text-xs text-gray-400 mb-4">Departures recorded across departments</p>

            {deptChartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="department" tick={{ fontSize: 11, fill: "#64748B" }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#253C7D" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-400 text-xs">No department data available</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG MODALS                                                             */}
      {/* ========================================================================= */}

      {/* 1. START OFFBOARDING MODAL */}
      {createModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !submitting && setCreateModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                  <i className="ri-user-unfollow-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Initiate Employee Offboarding</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Start exit workflow & clearance checklist</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreateModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={createOffboarding} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Departing Employee <span className="text-rose-500">*</span>
                </label>
                <EmployeeSearchSelect
                  employees={employees}
                  value={newForm.employee_id}
                  onChange={(id) => setNewForm({ ...newForm, employee_id: id })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Last Working Day <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.last_day}
                    onChange={(e) => setNewForm({ ...newForm, last_day: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Reason for Exit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newForm.reason}
                    onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    {EXIT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Handover & Transition Notes
                </label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Key responsibilities to transition, specific project handovers..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-gray-200/70 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newForm.includeDefaultTasks}
                    onChange={(e) => setNewForm({ ...newForm, includeDefaultTasks: e.target.checked })}
                    className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Auto-generate standard multi-department exit checklist
                  </span>
                </label>
                <p className="text-[11px] text-gray-400 mt-1 pl-6">
                  Includes IT hardware return, system access revocation, HR exit interview, and final payroll clearance.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Starting..." : "Start Offboarding Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD TASK MODAL */}
      {taskModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !submittingTask && setTaskModal({ open: false, offboardingId: null })}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                  <i className="ri-add-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Exit Task</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Attach custom clearance item</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTaskModal({ open: false, offboardingId: null })}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="e.g., Return credit card, Transfer GitHub ownership..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={newTaskForm.type}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="IT">IT & Access</option>
                    <option value="HR">HR & People</option>
                    <option value="Finance">Finance & Payroll</option>
                    <option value="Operations">Operations / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.assignee}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
                    placeholder="e.g., IT Team, HR Dept..."
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskForm.due_date}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, due_date: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTaskModal({ open: false, offboardingId: null })}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {submittingTask ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT OFFBOARDING MODAL */}
      {editingOffboarding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !savingEdit && setEditingOffboarding(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-edit-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Offboarding Details</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {editingOffboarding.employees?.first_name} {editingOffboarding.employees?.last_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingOffboarding(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Last Working Day
                  </label>
                  <input
                    type="date"
                    required
                    value={editForm.last_day}
                    onChange={(e) => setEditForm({ ...editForm, last_day: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Stage
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, meta]) => (
                      <option key={k} value={k}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Reason for Departure
                </label>
                <select
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                >
                  {EXIT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Transition Notes
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Exit remarks, handover status..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOffboarding(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}