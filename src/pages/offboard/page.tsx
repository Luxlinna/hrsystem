import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

interface Offboarding {
  id: string;
  employee_id: string;
  last_day: string;
  reason: string;
  status: string;
  created_at: string;
  employees?: { first_name: string; last_name: string; role: string; branch_id: string; branches?: { name: string } } | null;
  tasks?: OffboardingTask[];
}

interface OffboardingTask {
  id: string;
  title: string;
  type: string;
  assignee: string;
  status: string;
  due_date: string | null;
}

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

const statusLabels: Record<string, string> = {
  notice_period: "Notice Period",
  exit_interview: "Exit Interview",
  clearance: "Clearance",
  completed: "Completed",
};

const statusColors: Record<string, string> = {
  notice_period: "bg-amber-50 text-amber-700",
  exit_interview: "bg-blue-50 text-blue-700",
  clearance: "bg-purple-50 text-purple-700",
  completed: "bg-green-50 text-green-700",
};

export default function Offboard() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [tab, setTab] = useState<"active" | "completed" | "tasks">("active");
  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({ employee_id: "", last_day: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    loadData();
  }, []);

  // Arriving here from a notification (?highlight=<offboarding id>) should
  // switch to whichever tab that record actually lives in and scroll to it.
  useEffect(() => {
    if (!highlightId || offboardings.length === 0) return;
    const match = offboardings.find((o) => o.id === highlightId);
    if (!match) return;
    setTab(match.status === "completed" ? "completed" : "active");
    // setTab above hasn't repainted the DOM yet in this same tick — the
    // target tab's content doesn't exist to scroll to until React commits.
    const t = setTimeout(() => {
      const el = document.getElementById(`offboarding-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(t);
  }, [highlightId, offboardings]);

  const loadData = async () => {
    setLoading(true);
    const { data: off } = await supabase
      .from("offboarding_requests")
      .select("*, employees(first_name, last_name, role, branch_id, branches(name))")
      .order("last_day", { ascending: true });

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

    const { data: emps } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role")
      .eq("status", "active")
      .order("first_name");
    setEmployees(emps || []);
    setLoading(false);
  };

  const activeOffboardings = offboardings.filter((o) => o.status !== "completed");
  const completedOffboardings = offboardings.filter((o) => o.status === "completed");
  const allTasks = offboardings.flatMap((o) =>
    (o.tasks || []).map((t) => ({ ...t, employeeName: `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}` }))
  );

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("offboarding_tasks").update({ status: next }).eq("id", taskId);
    if (error) { toast("Error", "Failed to update task", "error"); return; }
    toast(next === "completed" ? "Task completed" : "Task reopened", "", "success");
    loadData();
  };

  const updateOffboardingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("offboarding_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast("Error", "Failed to update status", "error"); return; }
    toast("Status updated", statusLabels[status], "success");
    const record = offboardings.find((o) => o.id === id);
    const empName = record?.employees ? `${record.employees.first_name} ${record.employees.last_name}` : "an employee";
    logActivity({
      module: "offboard",
      action: status === "completed" ? "processed" : "updated",
      entityType: "offboarding_request",
      entityId: id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Offboarding for ${empName} moved to ${statusLabels[status] || status}`,
    });
    if (status === "completed") {
      notify({ source: "offboard", type: "info", title: "Offboarding completed", message: `${empName}'s exit process is complete.`, entityId: id });
    }
    loadData();
  };

  const createOffboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.employee_id || !newForm.last_day || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("offboarding_requests")
      .insert([{ employee_id: newForm.employee_id, last_day: newForm.last_day, reason: newForm.reason, status: "notice_period" }])
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast("Error", "Failed to start offboarding", "error");
      return;
    }

    await supabase.from("offboarding_tasks").insert([
      { offboarding_id: data.id, title: "Return company laptop", type: "IT", assignee: "IT Team", status: "pending", due_date: newForm.last_day },
      { offboarding_id: data.id, title: "Exit interview", type: "HR", assignee: "HR Team", status: "pending", due_date: newForm.last_day },
      { offboarding_id: data.id, title: "Final paycheck", type: "Finance", assignee: "Payroll", status: "pending", due_date: newForm.last_day },
      { offboarding_id: data.id, title: "Revoke system access", type: "IT", assignee: "IT Team", status: "pending", due_date: newForm.last_day },
    ]);

    setSubmitting(false);
    setCreateModal(false);
    const emp = employees.find((e) => e.id === newForm.employee_id);
    setNewForm({ employee_id: "", last_day: "", reason: "" });
    toast("Offboarding created", "Employee exit process started", "success");
    logActivity({
      module: "offboard",
      action: "created",
      entityType: "offboarding_request",
      entityId: data.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Offboarding started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}`,
    });
    notify({ source: "offboard", type: "warning", title: "Offboarding started", message: `Exit process started for ${emp ? `${emp.first_name} ${emp.last_name}` : "an employee"}, last day ${newForm.last_day}.`, entityId: data.id });
    loadData();
  };

  const totalActive = activeOffboardings.length;
  const totalCompleted = completedOffboardings.length;
  const overdueTasks = allTasks.filter((t) => t.status === "pending" && t.due_date && new Date(t.due_date + "T00:00:00") < new Date()).length;

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Offboarding</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage employee departures and exit processes</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="px-4 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] whitespace-nowrap"
        >
          <i className="ri-user-unfollow-line mr-1" />
          Start Offboarding
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-amber-700">{totalActive}</p>
          <p className="text-[12px] font-medium text-amber-600 mt-1">Active Offboardings</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-gray-700">{totalCompleted}</p>
          <p className="text-[12px] font-medium text-gray-600 mt-1">Completed This Year</p>
        </div>
        <div className="bg-red-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-red-700">{overdueTasks}</p>
          <p className="text-[12px] font-medium text-red-600 mt-1">Overdue Tasks</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["active", "completed", "tasks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors whitespace-nowrap ${
              tab === t ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "active" ? "Active" : t === "completed" ? "Completed" : "All Tasks"}
            {t === "active" && totalActive > 0 && <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-[10px]">{totalActive}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {(tab === "active" || tab === "completed") && (
            <div className="space-y-4">
              {(tab === "active" ? activeOffboardings : completedOffboardings).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <i className="ri-check-double-line text-4xl text-gray-300 mb-2 block" />
                  <p className="text-[13px] text-gray-500">{tab === "active" ? "No active offboardings" : "No completed offboardings yet"}</p>
                </div>
              ) : (
                (tab === "active" ? activeOffboardings : completedOffboardings).map((o) => {
                  const done = o.tasks?.filter((t) => t.status === "completed").length || 0;
                  const total = o.tasks?.length || 0;
                  const pct = total > 0 ? (done / total) * 100 : 0;
                  return (
                    <div
                      key={o.id}
                      id={`offboarding-${o.id}`}
                      tabIndex={-1}
                      className={`bg-white rounded-2xl border p-5 md:p-6 outline-none ${
                        o.id === highlightId ? "border-[#253C7D] ring-2 ring-[#253C7D]/30" : "border-gray-100"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                            {o.employees?.first_name?.[0]}{o.employees?.last_name?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={`/employees/${o.employee_id}`} className="text-[15px] font-semibold text-gray-900 hover:text-[#253C7D] transition-colors">
                                {o.employees?.first_name} {o.employees?.last_name}
                              </Link>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[o.status]}`}>
                                {statusLabels[o.status]}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-500">{o.employees?.role} - {o.employees?.branches?.name || "Headquarters"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[12px] text-gray-500">Last day: {new Date(o.last_day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          {tab === "active" && (
                            <select
                              value={o.status}
                              onChange={(e) => updateOffboardingStatus(o.id, e.target.value)}
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white cursor-pointer focus:outline-none focus:border-[#253C7D]"
                            >
                              {Object.entries(statusLabels).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-gray-500">Exit tasks</span>
                          <span className="text-[11px] font-semibold text-gray-700">{done}/{total}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#253C7D] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                        {(o.tasks || []).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => toggleTask(t.id, t.status)}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                              t.status === "completed"
                                ? "bg-green-50 border-green-100 text-green-800"
                                : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-amber-50 hover:border-amber-100"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              t.status === "completed" ? "bg-green-500 border-green-500" : "border-gray-300"
                            }`}>
                              {t.status === "completed" && <i className="ri-check-line text-white text-xs w-4 h-4 flex items-center justify-center" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[12px] font-medium truncate ${t.status === "completed" ? "line-through text-green-700" : ""}`}>{t.title}</p>
                              <p className="text-[10px] text-gray-400">{t.type} - {t.assignee}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      {o.reason && <p className="text-[12px] text-gray-400 mt-3">Reason: {o.reason}</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-5 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Task</span>
                  <span>Type</span>
                  <span>Employee</span>
                  <span>Status</span>
                  <span>Assignee</span>
                </div>
                {allTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-[13px]">No tasks found</div>
                ) : (
                  allTasks.map((t) => (
                    <div key={t.id} className="grid grid-cols-5 px-5 py-4 border-t border-gray-50 items-center">
                      <span className="text-[13px] font-medium text-gray-900">{t.title}</span>
                      <span className="text-[13px] text-gray-600">{t.type}</span>
                      <span className="text-[13px] text-gray-700">{t.employeeName}</span>
                      <button onClick={() => toggleTask(t.id, t.status)} className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit cursor-pointer ${
                        t.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {t.status}
                      </button>
                      <span className="text-[13px] text-gray-500">{t.assignee}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Start Offboarding</h3>
              <button onClick={() => setCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={createOffboarding} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Employee</label>
                <select
                  required
                  value={newForm.employee_id}
                  onChange={(e) => setNewForm({ ...newForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} - {emp.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Last Day</label>
                <input
                  type="date"
                  required
                  value={newForm.last_day}
                  onChange={(e) => setNewForm({ ...newForm, last_day: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={newForm.reason}
                  onChange={(e) => setNewForm({ ...newForm, reason: e.target.value })}
                  placeholder="e.g., Career change, Relocation..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A]">
                Start Offboarding Process
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}