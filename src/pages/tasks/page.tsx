import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
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
  employees?: { first_name: string; last_name: string; department: string } | null;
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

const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-sky-50 text-sky-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

// Local (not UTC) YYYY-MM-DD — toISOString() shifts to UTC, which mislabels
// "today" during early-morning hours in timezones ahead of UTC (e.g. ICT).
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
  return isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const ACTIVITY_ICON: Record<TaskActivity["action"], string> = {
  created: "ri-add-circle-line",
  status_changed: "ri-arrow-left-right-line",
  assigned: "ri-user-swap-line",
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
        ? `reassigned the task from ${a.old_value} to ${a.new_value || "an employee"}`
        : `assigned the task to ${a.new_value || "an employee"}`;
    default:
      switch (a.field) {
        case "title":
          return "updated the title";
        case "description":
          return "updated the description";
        case "priority":
          return a.old_value
            ? `changed priority from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
            : `set priority to ${prettyValue(a.new_value)}`;
        case "due_date":
          return a.new_value
            ? `changed due date to ${formatDueDate(a.new_value)}`
            : "removed the due date";
        default:
          return `updated ${a.field.replace(/_/g, " ")}`;
      }
  }
};

const emptyForm = { title: "", description: "", assigned_to: "", priority: "medium" as Task["priority"], due_date: "" };

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
  const [view, setView] = useState<"board" | "report">("board");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, branch_id")
      .eq("email", user.email)
      .maybeSingle();
    setMyEmployee(me);
    if (!me) { setEmployees([]); setTasks([]); setLoading(false); return; }

    if (canViewAll) {
      const [{ data: emp }, { data: t }] = await Promise.all([
        supabase.from("employees").select("id, first_name, last_name, department, avatar_url").eq("status", "active").order("first_name"),
        supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department)").is("deleted_at", null).order("created_at", { ascending: false }),
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
        ? await supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department)").in("assigned_to", ids).is("deleted_at", null).order("created_at", { ascending: false })
        : { data: [] };
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    setEmployees([me]);
    const { data: t } = await supabase
      .from("tasks")
      .select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department)")
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

  // Keep the modal's activity feed live while it's open.
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

  // Close the task dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(e.target as Node)) setTaskOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset dropdown state when the modal closes.
  useEffect(() => {
    if (!showModal) {
      setTaskOpen(false);
      setTaskSearch("");
    }
  }, [showModal]);

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, assigned_to: myEmployee?.id || "" });
    setAssignedToIds(myEmployee ? [myEmployee.id] : []);
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || "",
      assigned_to: t.assigned_to,
      priority: t.priority,
      due_date: t.due_date || "",
    });
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
        priority: form.priority,
        due_date: form.due_date || null,
        updated_at: new Date().toISOString(),
      }).eq("id", editingTask.id);
      setSaving(false);
      if (error) { showToast("error", "Couldn't update task."); return; }
      showToast("success", "Task updated.");
    } else {
      if (!form.title.trim() || assignedToIds.length === 0 || !myEmployee) return;
      setSaving(true);
      const payload = assignedToIds.map((empId) => ({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: empId,
        assigned_by: myEmployee.id,
        priority: form.priority,
        due_date: form.due_date || null,
      }));
      const { error } = await supabase.from("tasks").insert(payload);
      setSaving(false);
      if (error) { showToast("error", "Couldn't create task."); return; }
      showToast("success", `${assignedToIds.length} task${assignedToIds.length === 1 ? '' : 's'} created.`);
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
    else loadData();
  };

  const handleDelete = async (t: Task) => {
    if (!confirm(`Delete "${t.title}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", t.id);
    if (error) showToast("error", "Couldn't delete task.");
    else { showToast("success", "Task moved to Recycle Bin."); setShowModal(false); loadData(); }
  };

  const tasksFor = (status: Task["status"]) => tasks.filter((t) => t.status === status);
  const overdueCount = tasks.filter(isOverdue).length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  // Per-employee report: total/done/overdue, only meaningful for managers.
  const report = employees.map((e) => {
    const own = tasks.filter((t) => t.assigned_to === e.id);
    const done = own.filter((t) => t.status === "done").length;
    const overdue = own.filter(isOverdue).length;
    return { employee: e, total: own.length, done, overdue, onTimeRate: own.length ? Math.round((done / own.length) * 100) : 0 };
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold text-white shadow-lg ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tasks
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {canManage ? "Assign, track, and evaluate your team's work" : "Keep track of your own work"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <i className="ri-list-check-3 text-lg text-[#253C7D]" />
          <p className="text-xl font-bold text-gray-900 mt-2">{tasks.length}</p>
          <p className="text-[11px] text-gray-500">Total Tasks</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <i className="ri-loader-4-line text-lg text-sky-600" />
          <p className="text-xl font-bold text-gray-900 mt-2">{tasksFor("in_progress").length}</p>
          <p className="text-[11px] text-gray-500">In Progress</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <i className="ri-error-warning-line text-lg text-red-500" />
          <p className="text-xl font-bold text-gray-900 mt-2">{overdueCount}</p>
          <p className="text-[11px] text-gray-500">Overdue</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <i className="ri-checkbox-circle-line text-lg text-emerald-600" />
          <p className="text-xl font-bold text-gray-900 mt-2">{doneCount}</p>
          <p className="text-[11px] text-gray-500">Completed</p>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit mb-5">
          <button
            onClick={() => setView("board")}
            className={`px-4 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${view === "board" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Board
          </button>
          <button
            onClick={() => setView("report")}
            className={`px-4 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${view === "report" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            <i className="ri-bar-chart-2-line mr-1" />
            Team Report
          </button>
        </div>
      )}

      {view === "report" && canManage ? (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {report.map(({ employee, total, done, overdue, onTimeRate }) => (
                <tr key={employee.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{employee.first_name} {employee.last_name}</p>
                    <p className="text-[11px] text-gray-400">{employee.department}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{total}</td>
                  <td className="px-4 py-3 text-emerald-600 font-semibold">{done}</td>
                  <td className="px-4 py-3">
                    <span className={overdue > 0 ? "text-red-500 font-semibold" : "text-gray-400"}>{overdue}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 max-w-[140px]">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#253C7D] rounded-full" style={{ width: `${onTimeRate}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-500 shrink-0">{onTimeRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-[13px]">No team members to report on.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((col) => (
            <div key={col.key} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-gray-900">{col.label}</h3>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tasksFor(col.key).length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {tasksFor(col.key).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => openEdit(t)}
                    className="border border-gray-100 rounded-xl p-3 hover:border-[#253C7D]/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug">{t.title}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</span>
                    </div>
                    {canManage && t.employees && (
                      <p className="text-[11px] text-gray-500 mb-1">{t.employees.first_name} {t.employees.last_name}</p>
                    )}
                    {t.due_date && (
                      <p className={`text-[11px] flex items-center gap-1 ${isOverdue(t) ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                        <i className="ri-calendar-line" /> {t.due_date}{isOverdue(t) ? " — overdue" : ""}
                      </p>
                    )}
                    <select
                      value={t.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(t, e.target.value as Task["status"])}
                      className="mt-2 w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#253C7D] cursor-pointer bg-gray-50"
                    >
                      {STATUS_COLUMNS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
                {tasksFor(col.key).length === 0 && (
                  <p className="text-[12px] text-gray-300 text-center py-6">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">{editingTask ? "Edit Task" : "New Task"}</h3>

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Prepare monthly report"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Optional details..."
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none"
            />

            {canManage ? (
              <>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{editingTask ? "Assigned To" : "Assigned To (select multiple)"}</label>
                {editingTask ? (
                  <EmployeeSearchSelect
                    employees={employees}
                    value={form.assigned_to}
                    onChange={(id) => setForm({ ...form, assigned_to: id })}
                  />
                ) : (
                  <>
                    <div className="relative" ref={taskRef}>
                      <div className="relative">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                        <input
                          type="text"
                          role="combobox"
                          aria-expanded={taskOpen}
                          value={taskOpen ? taskSearch : assignedToIds.length > 0 ? `${assignedToIds.length} employee${assignedToIds.length === 1 ? '' : 's'} selected` : taskSearch}
                          onChange={(e) => { setTaskSearch(e.target.value); setTaskOpen(true); }}
                          onFocus={() => setTaskOpen(true)}
                          placeholder="Search by name, department..."
                          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
                        />
                        <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {taskOpen && (() => {
                        const filtered = employees.filter((emp) => {
                          const q = taskSearch.trim().toLowerCase();
                          if (!q) return true;
                          return `${emp.first_name} ${emp.last_name} ${emp.department}`.toLowerCase().includes(q);
                        });
                        return (
                          <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                            <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {filtered.length} employee{filtered.length === 1 ? '' : 's'}{taskSearch.trim() ? ` matching "${taskSearch.trim()}"` : ''}
                            </p>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const allIds = filtered.map((e) => e.id);
                                const allSelected = allIds.length > 0 && allIds.every((id) => assignedToIds.includes(id));
                                setAssignedToIds(allSelected ? [] : allIds);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                filtered.length > 0 && filtered.every((e) => assignedToIds.includes(e.id))
                                  ? "bg-[#253C7D] border-[#253C7D]"
                                  : filtered.some((e) => assignedToIds.includes(e.id))
                                    ? "bg-[#253C7D]/20 border-[#253C7D]"
                                    : "border-gray-300 bg-white"
                              }`}>
                                {filtered.length > 0 && filtered.every((e) => assignedToIds.includes(e.id)) && <i className="ri-check-line text-white text-xs" />}
                                {filtered.some((e) => assignedToIds.includes(e.id)) && !(filtered.length > 0 && filtered.every((e) => assignedToIds.includes(e.id))) && <span className="w-2 h-0.5 bg-[#253C7D] rounded" />}
                              </span>
                              Select all ({filtered.length})
                            </button>
                            {filtered.length === 0 ? (
                              <p className="px-3 py-4 text-[12px] text-gray-400">No employees found.</p>
                            ) : (
                              filtered.map((emp) => {
                                const checked = assignedToIds.includes(emp.id);
                                return (
                                  <label
                                    key={emp.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${checked ? "bg-[#253C7D]/5" : "hover:bg-gray-50"}`}
                                  >
                                    <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                      checked ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300 bg-white"
                                    }`}>
                                      {checked && <i className="ri-check-line text-white text-xs" />}
                                    </span>
                                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                      setAssignedToIds((prev) => prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]);
                                    }} />
                                    <span className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                      {emp.avatar_url ? (
                                        <img src={emp.avatar_url} alt="" className="w-7 h-7 object-cover" />
                                      ) : (
                                        `${emp.first_name[0] || ''}${emp.last_name[0] || ''}`.toUpperCase()
                                      )}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                      <span className="block text-[13px] font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                                      <span className="block text-[11px] text-gray-400 truncate">{emp.department}</span>
                                    </span>
                                    {checked && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {assignedToIds.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-gray-400">{assignedToIds.length} employee{assignedToIds.length === 1 ? '' : 's'} selected</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="mb-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700">
                {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}` : "—"}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingTask && (
                <button
                  onClick={() => handleDelete(editingTask)}
                  className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-50 cursor-pointer"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#253C7D] text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving..." : editingTask ? "Save Changes" : assignedToIds.length > 1 ? `Create ${assignedToIds.length} Tasks` : "Create Task"}
              </button>
            </div>

            {editingTask && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="ri-history-line text-[#253C7D]" />
                    Activity
                  </h4>
                  {!activityLoading && activities.length > 0 && (
                    <span className="text-[10px] text-gray-400">{activities.length} event{activities.length === 1 ? "" : "s"}</span>
                  )}
                </div>

                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <i className="ri-file-list-3-line text-2xl mb-2" />
                    <p className="text-[12px]">No activity yet — changes will appear here.</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
                    {activities.map((a, i) => {
                      const name = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "System";
                      const avatar = a.employees?.avatar_url;
                      const isLast = i === activities.length - 1;
                      const showValueChip = a.action === "status_changed" || (a.action === "updated" && a.field === "priority");
                      return (
                        <div key={a.id} className="relative pb-4 last:pb-0">
                          <div className="flex gap-3">
                            <div className="relative shrink-0">
                              {avatar ? (
                                <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[11px] font-bold">
                                  {initials(name)}
                                </div>
                              )}
                              {!isLast && <span className="absolute left-1/2 top-9 bottom-[-16px] w-px bg-gray-100 -translate-x-1/2" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-[13px] leading-snug text-gray-800">
                                <span className="font-semibold text-gray-900">{name}</span>{" "}
                                {activityText(a)}
                                {showValueChip && a.new_value && (
                                  <span className={`ml-1.5 align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                                    a.action === "status_changed"
                                      ? a.new_value === "done"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : a.new_value === "blocked"
                                          ? "bg-red-50 text-red-600"
                                          : a.new_value === "in_progress"
                                            ? "bg-sky-50 text-sky-700"
                                            : "bg-gray-100 text-gray-600"
                                      : PRIORITY_STYLE[a.new_value as Task["priority"]]
                                  }`}>
                                    {prettyValue(a.new_value)}
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                                <i className={`${ACTIVITY_ICON[a.action]} ${ACTIVITY_COLOR[a.action]} text-xs`} />
                                <span>{formatRelative(a.created_at)}</span>
                                <span>·</span>
                                <span>{formatExact(a.created_at)}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
