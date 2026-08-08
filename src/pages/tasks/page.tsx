import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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

const emptyForm = { title: "", description: "", assigned_to: "", priority: "medium" as Task["priority"], due_date: "" };

export default function TasksPage() {
  const { user } = useAuth();
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
  const [saving, setSaving] = useState(false);

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
        supabase.from("employees").select("id, first_name, last_name, department").eq("status", "active").order("first_name"),
        supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department)").order("created_at", { ascending: false }),
      ]);
      setEmployees(emp || []);
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase.from("employees").select("id, first_name, last_name, department").eq("status", "active").eq("branch_id", me.branch_id).order("first_name");
      setEmployees(team || []);
      const ids = (team || []).map((e) => e.id);
      const { data: t } = ids.length
        ? await supabase.from("tasks").select("*, employees!tasks_assigned_to_fkey(first_name, last_name, department)").in("assigned_to", ids).order("created_at", { ascending: false })
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

  const openCreate = () => {
    setEditingTask(null);
    setForm({ ...emptyForm, assigned_to: myEmployee?.id || "" });
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
    if (!form.title.trim() || !form.assigned_to || !myEmployee) return;
    setSaving(true);

    if (editingTask) {
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
      const { error } = await supabase.from("tasks").insert({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: form.assigned_to,
        assigned_by: myEmployee.id,
        priority: form.priority,
        due_date: form.due_date || null,
      });
      setSaving(false);
      if (error) { showToast("error", "Couldn't create task."); return; }
      showToast("success", "Task created.");
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
    if (!confirm(`Delete "${t.title}"?`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", t.id);
    if (error) showToast("error", "Couldn't delete task.");
    else { showToast("success", "Task deleted."); setShowModal(false); loadData(); }
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
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
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Assigned To</label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}{e.id === myEmployee?.id ? " (Me)" : ""} — {e.department}</option>
                  ))}
                </select>
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
                {saving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
