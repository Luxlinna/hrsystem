import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import CheckInOutModal from "./CheckInOutModal";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

const fmtDuration = (from: string, to: string | null) => {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  avatar_url?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  is_outside_work: boolean;
  work_status: "checked_in" | "checked_out" | null;
  work_checked_in_at: string | null;
  work_checked_out_at: string | null;
  work_lat: number | null;
  work_lng: number | null;
  work_accuracy_m: number | null;
  work_address: string | null;
  work_image_url: string | null;
  work_check_out_lat: number | null;
  work_check_out_lng: number | null;
  work_check_out_accuracy_m: number | null;
  work_check_out_address: string | null;
  work_check_out_image_url: string | null;
  employees?: { first_name: string; last_name: string; department: string; avatar_url?: string } | null;
}

interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: "created" | "status_changed" | "assigned" | "updated";
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  employees?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface FormState {
  title: string;
  description: string;
  assigned_to: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string;
  is_outside_work: boolean;
}

const STATUS_CONFIG: Record<
  Task["status"],
  { label: string; icon: string; headerBg: string; border: string; badge: string; accent: string }
> = {
  todo: {
    label: "To Do",
    icon: "ri-checkbox-blank-circle-line",
    headerBg: "bg-slate-50",
    border: "border-slate-200/80",
    badge: "bg-slate-100 text-slate-700",
    accent: "#64748B",
  },
  in_progress: {
    label: "In Progress",
    icon: "ri-progress-4-line",
    headerBg: "bg-sky-50/50",
    border: "border-sky-200/80",
    badge: "bg-sky-50 text-sky-700 border border-sky-200/60",
    accent: "#0284C7",
  },
  blocked: {
    label: "Blocked",
    icon: "ri-error-warning-line",
    headerBg: "bg-rose-50/50",
    border: "border-rose-200/80",
    badge: "bg-rose-50 text-rose-700 border border-rose-200/60",
    accent: "#E11D48",
  },
  done: {
    label: "Completed",
    icon: "ri-checkbox-circle-fill",
    headerBg: "bg-emerald-50/50",
    border: "border-emerald-200/80",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    accent: "#059669",
  },
};

const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Completed" },
];

const PRIORITY_META: Record<
  Task["priority"],
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: "ri-arrow-down-line" },
  medium: { label: "Medium", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/70", icon: "ri-equal-line" },
  high: { label: "High", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80", icon: "ri-arrow-up-line" },
  urgent: { label: "Urgent", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", icon: "ri-fire-line" },
};

// Local YYYY-MM-DD
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isOverdue = (t: Task) => !!t.due_date && t.due_date < today() && t.status !== "done";

const prettyValue = (v: string | null) => (v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

const formatRelative = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatExact = (ts: string) =>
  new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const formatDueDate = (v: string | null) => {
  if (!v) return "";
  const d = new Date(`${v}T00:00:00`);
  if (isNaN(d.getTime())) return v;
  const todayStr = today();
  if (v === todayStr) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (v === tomStr) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ACTIVITY_ICON: Record<TaskActivity["action"], string> = {
  created: "ri-add-circle-line",
  status_changed: "ri-arrow-left-right-line",
  assigned: "ri-user-shared-line",
  updated: "ri-edit-line",
};

const ACTIVITY_COLOR: Record<TaskActivity["action"], string> = {
  created: "text-emerald-500",
  status_changed: "text-sky-500",
  assigned: "text-violet-500",
  updated: "text-gray-400",
};

const activityText = (a: TaskActivity) => {
  switch (a.action) {
    case "created":
      return "created this task";
    case "status_changed":
      return a.old_value
        ? `changed status from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
        : `moved task to ${prettyValue(a.new_value)}`;
    case "assigned":
      return a.old_value
        ? `reassigned task from ${a.old_value} to ${a.new_value || "an employee"}`
        : `assigned task to ${a.new_value || "an employee"}`;
    default:
      switch (a.field) {
        case "title":
          return "updated title";
        case "description":
          return "updated description";
        case "priority":
          return a.old_value
            ? `changed priority from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
            : `set priority to ${prettyValue(a.new_value)}`;
        case "due_date":
          return a.new_value
            ? `changed deadline to ${formatDueDate(a.new_value)}`
            : "removed deadline";
        default:
          return `updated ${a.field.replace(/_/g, " ")}`;
      }
  }
};

const emptyForm: FormState = {
  title: "",
  description: "",
  assigned_to: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  is_outside_work: false,
};

export default function TasksPage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.task_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.task_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "list" | "report">("board");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterQuickState, setFilterQuickState] = useState<"all" | "my_tasks" | "overdue" | "high_priority">("all");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals & Form
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"details" | "activity">("details");

  // Outside work capture state
  const [owTaskId, setOwTaskId] = useState<string | null>(null);
  const [owMode, setOwMode] = useState<"check_in" | "check_out">("check_in");
  const [owTick, setOwTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setOwTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const openCheckInOut = (taskId: string, mode: "check_in" | "check_out") => {
    setOwTaskId(taskId);
    setOwMode(mode);
  };

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, branch_id, avatar_url")
      .eq("email", user.email)
      .maybeSingle();
    setMyEmployee(me);
    if (!me) { setEmployees([]); setTasks([]); setLoading(false); return; }

    if (canViewAll) {
      const [{ data: emp }, { data: t }] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, department, avatar_url").eq("status", "active").order("first_name"),
        supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)").is("deleted_at", null).order("created_at", { ascending: false }),
      ]);
      setEmployees(emp || []);
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase.from("employees").select("id, first_name, last_name, department, avatar_url").eq("status", "active").eq("branch_id", me.branch_id).order("first_name");
      setEmployees(team || []);
      const ids = (team || []).map((e) => e.id);
      const { data: t } = ids.length
        ? await supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)").in("assigned_to", ids).is("deleted_at", null).order("created_at", { ascending: false })
        : { data: [] };
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    setEmployees([me]);
    const { data: t } = await supabase
      .from("tasks")
      .select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)")
      .eq("assigned_to", me.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setTasks((t as any) || []);
    setLoading(false);
  }, [user?.email, canViewAll, canViewOwnBranch]);

  useEffect(() => {
    if (permsLoading) return;
    loadData();
    const ch = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [permsLoading, loadData]);

  const loadActivities = useCallback(async (taskId: string) => {
    setActivityLoading(true);
    const { data } = await supabase
      .from("task_activities")
      .select("*, employees(first_name, last_name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    setActivities((data as TaskActivity[]) || []);
    setActivityLoading(false);
  }, []);

  // Keep modal activity feed live
  useEffect(() => {
    if (!showModal || !editingTask) { setActivities([]); return; }
    loadActivities(editingTask.id);
    const ch = supabase
      .channel("task-activities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_activities", filter: `task_id=eq.${editingTask.id}` },
        () => loadActivities(editingTask.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showModal, editingTask, loadActivities]);

  // Close task dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(e.target as Node)) setTaskOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openCreate = (initialStatus?: Task["status"]) => {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      status: initialStatus || "todo",
      assigned_to: myEmployee?.id || "",
    });
    setAssignedToIds(myEmployee ? [myEmployee.id] : []);
    setActiveModalTab("details");
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || "",
      assigned_to: t.assigned_to,
      status: t.status || "todo",
      priority: t.priority || "medium",
      due_date: t.due_date || "",
      is_outside_work: !!t.is_outside_work,
    });
    setActiveModalTab("details");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingTask) {
      if (!form.title.trim() || !form.assigned_to || !myEmployee) return;
      setSaving(true);
      const { error } = await supabase.from("tasks").update({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: form.assigned_to,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        completed_at: form.status === "done" ? (editingTask.completed_at || new Date().toISOString()) : null,
        is_outside_work: form.is_outside_work,
        updated_at: new Date().toISOString(),
      }).eq("id", editingTask.id);
      setSaving(false);
      if (error) { showToast("error", "Couldn't update task."); return; }
      showToast("success", "Task updated successfully.");
    } else {
      if (!form.title.trim() || assignedToIds.length === 0 || !myEmployee) return;
      setSaving(true);
      const payload = assignedToIds.map((empId) => ({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: empId,
        assigned_by: myEmployee.id,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        completed_at: form.status === "done" ? new Date().toISOString() : null,
        is_outside_work: form.is_outside_work,
      }));
      const { error } = await supabase.from("tasks").insert(payload);
      setSaving(false);
      if (error) { showToast("error", "Couldn't create task."); return; }
      showToast("success", `${assignedToIds.length} task${assignedToIds.length === 1 ? "" : "s"} created successfully.`);
    }
    setShowModal(false);
    loadData();
  };

  const handleStatusChange = async (t: Task, status: Task["status"]) => {
    const { error } = await supabase.from("tasks").update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", t.id);
    if (error) showToast("error", "Couldn't update status.");
    else {
      setTasks((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, status, completed_at: status === "done" ? new Date().toISOString() : null } : item))
      );
    }
  };

  const handleDelete = async (t: Task) => {
    if (!confirm(`Delete "${t.title}"? It will be moved to the Recycle Bin and can be restored anytime.`)) return;
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", t.id);
    if (error) showToast("error", "Couldn't delete task.");
    else {
      showToast("success", "Task moved to Recycle Bin.");
      setShowModal(false);
      loadData();
    }
  };

  // Drag and Drop Handling
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    handleStatusChange(task, targetStatus);
  };

  // Filtered Task Collection
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Quick State Filter
      if (filterQuickState === "my_tasks" && myEmployee && t.assigned_to !== myEmployee.id) return false;
      if (filterQuickState === "overdue" && !isOverdue(t)) return false;
      if (filterQuickState === "high_priority" && !["high", "urgent"].includes(t.priority)) return false;

      // Priority Filter
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;

      // Assignee Filter
      if (filterAssignee !== "all" && t.assigned_to !== filterAssignee) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}`.toLowerCase() : "";
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchEmp = empName.includes(q);
        const matchDept = (t.employees?.department || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEmp && !matchDept) return false;
      }

      return true;
    });
  }, [tasks, filterQuickState, filterPriority, filterAssignee, searchQuery, myEmployee]);

  const tasksFor = (status: Task["status"]) => filteredTasks.filter((t) => t.status === status);
  const totalOverdue = tasks.filter(isOverdue).length;
  const totalDone = tasks.filter((t) => t.status === "done").length;
  const totalInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const totalBlocked = tasks.filter((t) => t.status === "blocked").length;

  // Per-employee Report Matrix
  const report = useMemo(() => {
    return employees.map((e) => {
      const own = tasks.filter((t) => t.assigned_to === e.id);
      const done = own.filter((t) => t.status === "done").length;
      const inProg = own.filter((t) => t.status === "in_progress").length;
      const blocked = own.filter((t) => t.status === "blocked").length;
      const overdue = own.filter(isOverdue).length;
      const completionRate = own.length ? Math.round((done / own.length) * 100) : 0;
      return { employee: e, total: own.length, done, inProg, blocked, overdue, completionRate };
    }).sort((a, b) => b.total - a.total);
  }, [employees, tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success" ? "bg-[#253C7D]" : "bg-rose-600"
          }`}
        >
          <i className={toast.type === "success" ? "ri-checkbox-circle-fill text-emerald-300" : "ri-error-warning-fill"} />
          {toast.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Task Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Tasks & Workflows
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Live Board
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {canManage
              ? "Coordinate assignments, monitor milestone delivery, and track team execution in real-time."
              : "Organize your daily responsibilities, update progress, and meet project deadlines."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-line text-base font-bold" />
            New Task
                </button>
              </div>
      </div>

      {/* Executive KPI Summary Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total */}
        <div
          onClick={() => setFilterQuickState("all")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterQuickState === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <i className="ri-task-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{tasks.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Across all departments</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* In Progress */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <i className="ri-progress-4-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{totalInProgress}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active execution</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>

        {/* Blocked */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Blocked</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-error-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{totalBlocked}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Awaiting resolution</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Overdue */}
        <div
          onClick={() => setFilterQuickState(filterQuickState === "overdue" ? "all" : "overdue")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterQuickState === "overdue" ? "border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/20" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{totalOverdue}</p>
          <p className="text-[11px] text-rose-500/80 mt-0.5 font-medium">Requires attention</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Completed */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalDone}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {tasks.length > 0 ? `${Math.round((totalDone / tasks.length) * 100)}% overall completion` : "0% completion"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Productivity Control Bar: View Switcher, Live Search, & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: View Modes & Quick Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                view === "board" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-masonry-line text-sm" />
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                view === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check-2 text-sm" />
              List
            </button>
            {canManage && (
              <button
                onClick={() => setView("report")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  view === "report" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-bar-chart-box-line text-sm" />
                Team Matrix
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterQuickState("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                filterQuickState === "all"
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilterQuickState(filterQuickState === "my_tasks" ? "all" : "my_tasks")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                filterQuickState === "my_tasks"
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <i className="ri-user-smile-line text-xs" />
              Assigned to Me
            </button>
            <button
              onClick={() => setFilterQuickState(filterQuickState === "high_priority" ? "all" : "high_priority")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                filterQuickState === "high_priority"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
              }`}
            >
              <i className="ri-fire-line text-xs" />
              High / Urgent
            </button>
          </div>
        </div>

        {/* Right: Live Search & Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, assignee..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
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

          {/* Priority Select */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee Select */}
          {canManage && employees.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Assignees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          {(searchQuery || filterPriority !== "all" || filterAssignee !== "all" || filterQuickState !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterPriority("all");
                setFilterAssignee("all");
                setFilterQuickState("all");
              }}
              title="Reset all filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Main View Display */}

      {/* 1. KANBAN BOARD VIEW */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colConfig = STATUS_CONFIG[col.key];
            const colTasks = tasksFor(col.key);

            return (
              <div
                key={col.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`bg-white rounded-2xl border ${colConfig.border} shadow-2xs overflow-hidden flex flex-col min-h-[580px] transition-all`}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-gray-100 ${colConfig.headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colConfig.accent }} />
                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">{col.label}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200/80 text-gray-600 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => openCreate(col.key)}
                    title={`Add task to ${col.label}`}
                    className="w-6 h-6 rounded-lg bg-white border border-gray-200/80 text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line text-xs font-bold" />
                  </button>
                </div>

                {/* Column Tasks List */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[720px] no-scrollbar">
                  {colTasks.map((t) => {
                    const priorityMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                    const overdue = isOverdue(t);
                    const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned";

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => openEdit(t)}
                        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer group hover:shadow-md ${
                          draggedTaskId === t.id ? "opacity-40 border-dashed border-[#253C7D]" : "border-gray-200/80 hover:border-[#253C7D]/40"
                        }`}
                      >
                        {/* Top: Priority Badge & Action Options */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border} uppercase tracking-wider shadow-2xs`}
                          >
                            <i className={`${priorityMeta.icon} text-xs`} />
                            {priorityMeta.label}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Fast status toggle button */}
                            {t.status !== "done" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(t, "done");
                                }}
                                title="Mark as completed"
                                className="w-5 h-5 rounded-md text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <i className="ri-checkbox-blank-circle-line text-sm" />
                              </button>
                            ) : (
                              <span className="text-emerald-600" title="Completed">
                                <i className="ri-checkbox-circle-fill text-sm" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-[13px] font-bold text-gray-900 leading-snug group-hover:text-[#253C7D] transition-colors ${
                          t.status === "done" ? "line-through text-gray-400" : ""
                        }`}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        {/* Bottom: Assignee & Deadline Info */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                          {/* Assignee Avatar */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {t.employees?.avatar_url ? (
                              <img src={t.employees.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-extrabold flex items-center justify-center shrink-0">
                                {initials(empName)}
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-gray-600 truncate">{empName}</span>
                          </div>

                          {/* Due Date Indicator */}
                          {t.due_date && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded ${
                                overdue
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : t.due_date === today()
                                  ? "bg-amber-50 text-amber-700 font-bold"
                                  : "text-gray-500 bg-gray-50"
                              }`}
                            >
                              <i className={overdue ? "ri-error-warning-line text-rose-600" : "ri-calendar-event-line"} />
                              {formatDueDate(t.due_date)}
                            </span>
                          )}
                        </div>

                        {/* Outside Work: Check In / Out + Session */}
                        {t.is_outside_work && (
                          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                            {t.work_status === "checked_in" ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700">
                                      Checked in · {fmtDuration(t.work_checked_in_at!, null)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCheckInOut(t.id, "check_out"); }}
                                  className="w-full py-1.5 rounded-lg bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <i className="ri-logout-circle-r-line" />
                                  Check Out
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {t.work_status === "checked_out" && t.work_checked_out_at && (
                                  <p className="text-[10px] font-semibold text-gray-400">
                                    Checked out · {formatRelative(t.work_checked_out_at)}
                                  </p>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); openCheckInOut(t.id, "check_in"); }}
                                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <i className="ri-login-circle-line" />
                                  Check In
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200/80 rounded-xl text-gray-300">
                      <i className="ri-inbox-line text-2xl mb-1" />
                      <p className="text-xs font-semibold text-gray-400">No tasks in {col.label}</p>
                      <button
                        onClick={() => openCreate(col.key)}
                        className="mt-2 text-[11px] text-[#253C7D] font-bold hover:underline cursor-pointer"
                      >
                        + Create one
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. HIGH-DENSITY LIST VIEW */}
      {view === "list" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-10 text-center">Status</th>
                  <th className="px-4 py-3">Task Title & Details</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((t) => {
                  const priorityMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                  const statusConf = STATUS_CONFIG[t.status];
                  const overdue = isOverdue(t);
                  const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned";

                  return (
                    <tr
                      key={t.id}
                      onClick={() => openEdit(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStatusChange(t, t.status === "done" ? "todo" : "done")}
                          title={t.status === "done" ? "Mark as To Do" : "Mark as Done"}
                          className={`cursor-pointer transition-colors ${
                            t.status === "done" ? "text-emerald-600" : "text-gray-300 hover:text-emerald-600"
                          }`}
                        >
                          <i className={t.status === "done" ? "ri-checkbox-circle-fill text-lg" : "ri-checkbox-blank-circle-line text-lg"} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors ${
                          t.status === "done" ? "line-through text-gray-400" : ""
                        }`}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{t.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border} uppercase`}>
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-bold flex items-center justify-center shrink-0">
                            {initials(empName)}
                          </div>
                          <span className="font-semibold text-gray-800">{empName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {t.employees?.department || "General"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.due_date ? (
                          <span className={`font-semibold ${overdue ? "text-rose-600" : "text-gray-600"}`}>
                            {formatDueDate(t.due_date)}{overdue ? " (Overdue)" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as Task["status"])}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusConf.badge}`}
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      <i className="ri-file-search-line text-3xl mb-1 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">No tasks match your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TEAM PERFORMANCE REPORT MATRIX */}
      {view === "report" && canManage && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-gray-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Team Execution & Completion Matrix</h3>
              <p className="text-xs text-gray-500 mt-0.5">Summary of assigned work, completion rates, and delivery health by employee.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
              {employees.length} Staff Monitored
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-5 py-3.5">Team Member</th>
                  <th className="px-5 py-3.5 text-center">Total Assigned</th>
                  <th className="px-5 py-3.5 text-center text-sky-600">In Progress</th>
                  <th className="px-5 py-3.5 text-center text-emerald-600">Completed</th>
                  <th className="px-5 py-3.5 text-center text-rose-600">Overdue</th>
                  <th className="px-5 py-3.5">Completion Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map(({ employee, total, done, inProg, overdue, completionRate }) => (
                  <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {employee.avatar_url ? (
                          <img src={employee.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-black text-xs flex items-center justify-center">
                            {initials(`${employee.first_name} ${employee.last_name}`)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{employee.first_name} {employee.last_name}</p>
                          <p className="text-[11px] text-gray-400">{employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-800 text-sm">{total}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-sky-600">{inProg}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{done}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`font-bold px-2 py-0.5 rounded-full ${
                        overdue > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "text-gray-300"
                      }`}>
                        {overdue}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              completionRate >= 80 ? "bg-emerald-500" : completionRate >= 40 ? "bg-[#253C7D]" : "bg-amber-500"
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 min-w-[36px]">{completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Enterprise Slide-over / Modal for Task Creation & Edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => { if (!saving) setShowModal(false); }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm shrink-0">
                  <i className={editingTask ? "ri-file-list-3-line text-base" : "ri-add-line text-base"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {editingTask ? "Task Details" : "Create New Task"}
                    </h3>
                    {editingTask && (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[form.status]?.badge}`}>
                        {STATUS_CONFIG[form.status]?.label}
                      </span>
                    )}
                  </div>
                  {editingTask && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      Created {formatRelative(editingTask.created_at)} · Updated {formatRelative(editingTask.completed_at || editingTask.created_at)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {editingTask && (
                  <div className="flex items-center bg-gray-100/90 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab("details")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeModalTab === "details" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab("activity")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeModalTab === "activity" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <span>Activity</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        activeModalTab === "activity" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
                      }`}>
                        {activities.length}
                      </span>
                    </button>
                  </div>
                )}
                <div className="h-5 w-px bg-gray-200 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4.5 no-scrollbar">
              {activeModalTab === "details" ? (
                <>
                  {/* Task Title */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Task Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="What needs to be done? e.g. Finalize Q3 Employee Review"
                      className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                    />
                  </div>

                  {/* Status Selection Pill Buttons */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Status Stage
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STATUS_COLUMNS.map((s) => {
                        const cfg = STATUS_CONFIG[s.key];
                        const isSelected = form.status === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setForm({ ...form, status: s.key })}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `${cfg.badge} border-current shadow-xs ring-2 ring-current/15`
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <i className={cfg.icon} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Level Pill Buttons */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["low", "medium", "high", "urgent"] as Task["priority"][]).map((p) => {
                        const meta = PRIORITY_META[p];
                        const isSelected = form.priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setForm({ ...form, priority: p })}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? `${meta.bg} ${meta.text} border-current shadow-xs ring-2 ring-current/15`
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <i className={meta.icon} />
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assignee & Due Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Assignee Section */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        {editingTask ? "Assignee" : "Assign To"}
                      </label>
                      {canManage ? (
                        editingTask ? (
                          <EmployeeSearchSelect
                            employees={employees}
                            value={form.assigned_to}
                            onChange={(id) => setForm({ ...form, assigned_to: id })}
                          />
                        ) : (
                          <div className="relative" ref={taskRef}>
                            <div className="relative">
                              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                              <input
                                type="text"
                                value={taskOpen ? taskSearch : assignedToIds.length > 0 ? `${assignedToIds.length} staff selected` : taskSearch}
                                onChange={(e) => { setTaskSearch(e.target.value); setTaskOpen(true); }}
                                onFocus={() => setTaskOpen(true)}
                                placeholder="Search employees..."
                                className="w-full pl-9 pr-8 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                              />
                              <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            {taskOpen && (
                              <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 no-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allIds = employees.map((e) => e.id);
                                    const allSelected = allIds.length > 0 && allIds.every((id) => assignedToIds.includes(id));
                                    setAssignedToIds(allSelected ? [] : allIds);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#253C7D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer mb-1 border-b border-gray-100"
                                >
                                  <i className="ri-checkbox-multiple-line text-sm" />
                                  {assignedToIds.length === employees.length ? "Deselect All" : `Select All (${employees.length})`}
                                </button>
                                {employees
                                  .filter((e) => `${e.first_name} ${e.last_name} ${e.department}`.toLowerCase().includes(taskSearch.toLowerCase()))
                                  .map((emp) => {
                                    const checked = assignedToIds.includes(emp.id);
                                    return (
                                      <label
                                        key={emp.id}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                                          checked ? "bg-[#253C7D]/10" : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            setAssignedToIds((prev) =>
                                              prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                            );
                                          }}
                                          className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
                                        />
                                        <span className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[9px] flex items-center justify-center shrink-0">
                                          {initials(`${emp.first_name} ${emp.last_name}`)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-900 leading-none">{emp.first_name} {emp.last_name}</p>
                                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{emp.department}</p>
                                        </div>
                                      </label>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
                          {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}` : "—"}
                        </div>
                      )}
                    </div>

                    {/* Due Date & Shortcuts */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, due_date: today() })}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            const tm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                            setForm({ ...form, due_date: tm });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            const nw = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                            setForm({ ...form, due_date: nw });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          +7 Days
                        </button>
                        {form.due_date && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, due_date: "" })}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Description */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Description & Context
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Add detailed task scope, requirements, or documentation links..."
                      className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 resize-none transition-all"
                    />
                  </div>

                  {/* Outside Work Toggle */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_outside_work: !form.is_outside_work })}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-gray-50/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.is_outside_work ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-100 text-gray-400"}`}>
                          <i className="ri-map-pin-user-line text-base" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Outside Work</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {form.is_outside_work
                              ? editingTask
                                ? "Check in when you arrive at the work site"
                                : "You'll check in with location & photo when you arrive on-site"
                              : "Enable if this task is performed off-site"}
                          </p>
                        </div>
                      </div>
                      <div className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${form.is_outside_work ? "bg-[#253C7D]" : "bg-gray-300"}`}>
                        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${form.is_outside_work ? "left-[22px]" : "left-[3px]"}`} />
                      </div>
                    </button>

                    {/* Full Session Display when editing an outside-work task */}
                    {editingTask?.is_outside_work && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/30 space-y-3">
                        {/* Session status badge */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                            editingTask.work_status === "checked_in"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : editingTask.work_status === "checked_out"
                              ? "bg-gray-100 text-gray-600 border border-gray-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}>
                            {editingTask.work_status === "checked_in" && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                            {editingTask.work_status === "checked_in" ? "Active Session" : editingTask.work_status === "checked_out" ? "Session Complete" : "Not Checked In"}
                          </span>
                          {editingTask.work_checked_in_at && editingTask.work_checked_out_at && (
                            <span className="text-[11px] font-bold text-gray-500">
                              {fmtDuration(editingTask.work_checked_in_at, editingTask.work_checked_out_at)}
                            </span>
                          )}
                        </div>

                        {/* Check-in details */}
                        {editingTask.work_image_url && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                              <i className="ri-login-circle-line text-emerald-600" />
                              Check-in
                              {editingTask.work_checked_in_at && (
                                <span className="text-gray-400 font-medium normal-case ml-1">
                                  · {formatExact(editingTask.work_checked_in_at)}
                                </span>
                              )}
                            </label>
                            <img
                              src={editingTask.work_image_url}
                              alt="Check-in proof"
                              className="w-full h-36 object-cover rounded-xl border border-gray-200"
                            />
                            <div className="mt-1.5 space-y-0.5">
                              {editingTask.work_address && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-emerald-600" />
                                  {editingTask.work_address}
                                </p>
                              )}
                              {!editingTask.work_address && editingTask.work_lat != null && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-emerald-600" />
                                  {editingTask.work_lat}, {editingTask.work_lng}
                                </p>
                              )}
                              {editingTask.work_accuracy_m != null && (
                                <p className="text-[10px] text-gray-400">±{editingTask.work_accuracy_m}m accuracy</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Check-out details */}
                        {editingTask.work_check_out_image_url && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                              <i className="ri-logout-circle-r-line text-[#253C7D]" />
                              Check-out
                              {editingTask.work_checked_out_at && (
                                <span className="text-gray-400 font-medium normal-case ml-1">
                                  · {formatExact(editingTask.work_checked_out_at)}
                                </span>
                              )}
                            </label>
                            <img
                              src={editingTask.work_check_out_image_url}
                              alt="Check-out proof"
                              className="w-full h-36 object-cover rounded-xl border border-gray-200"
                            />
                            <div className="mt-1.5 space-y-0.5">
                              {editingTask.work_check_out_address && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-[#253C7D]" />
                                  {editingTask.work_check_out_address}
                                </p>
                              )}
                              {!editingTask.work_check_out_address && editingTask.work_check_out_lat != null && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-[#253C7D]" />
                                  {editingTask.work_check_out_lat}, {editingTask.work_check_out_lng}
                                </p>
                              )}
                              {editingTask.work_check_out_accuracy_m != null && (
                                <p className="text-[10px] text-gray-400">±{editingTask.work_check_out_accuracy_m}m accuracy</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* No session yet hint */}
                        {!editingTask.work_image_url && (
                          <p className="text-[11px] text-gray-400 text-center py-2">
                            No check-in data yet — use the Check In button on the task card.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Activity Feed Tab */
                <div className="space-y-3">
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <i className="ri-history-line text-3xl mb-1 text-gray-300" />
                      <p className="text-xs font-semibold">No activity recorded yet</p>
                      <p className="text-[11px] text-gray-400">Status and assignment updates will appear here automatically.</p>
                    </div>
                  ) : (
                    activities.map((a, i) => {
                      const name = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "System";
                      const showValueChip = a.action === "status_changed" || (a.action === "updated" && a.field === "priority");

                      return (
                        <div key={a.id} className="flex gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials(name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 font-medium leading-snug">
                              <span className="font-bold text-gray-900">{name}</span> {activityText(a)}
                              {showValueChip && a.new_value && (
                                <span className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                                  a.action === "status_changed"
                                    ? STATUS_CONFIG[a.new_value as Task["status"]]?.badge || "bg-gray-100 text-gray-700"
                                    : PRIORITY_META[a.new_value as Task["priority"]]?.bg || "bg-gray-100 text-gray-700"
                                }`}>
                                  {prettyValue(a.new_value)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                              <i className={`${ACTIVITY_ICON[a.action]} ${ACTIVITY_COLOR[a.action]} text-xs`} />
                              <span>{formatRelative(a.created_at)}</span>
                              <span>·</span>
                              <span>{formatExact(a.created_at)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
              {editingTask ? (
                <button
                  type="button"
                  onClick={() => handleDelete(editingTask)}
                  title="Move to Recycle Bin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm" />
                  Move to Recycle Bin
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="px-5 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : assignedToIds.length > 1 ? `Create ${assignedToIds.length} Tasks` : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {owTaskId && (
        <CheckInOutModal
          taskId={owTaskId}
          mode={owMode}
          onDone={() => { setOwTaskId(null); loadData(); }}
          onClose={() => setOwTaskId(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
