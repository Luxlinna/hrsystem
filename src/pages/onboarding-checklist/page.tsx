import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface ChecklistTask {
  id: string;
  onboarding_request_id: string;
  task_name: string;
  description: string | null;
  category: string;
  assigned_to: string | null;
  assigned_to_role: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  priority: string;
  sort_order: number;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface OnboardingHire {
  id: string;
  employee_id: string | null;
  stage: string;
  status: string;
  day_count: number;
  requested_by: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  documents: { label: "Documents", icon: "ri-file-text-line", color: "bg-amber-50 text-amber-700 border-amber-200" },
  it_setup: { label: "IT Setup", icon: "ri-computer-line", color: "bg-blue-50 text-blue-700 border-blue-200" },
  training: { label: "Training", icon: "ri-graduation-cap-line", color: "bg-purple-50 text-purple-700 border-purple-200" },
  general: { label: "General", icon: "ri-checkbox-circle-line", color: "bg-gray-50 text-gray-700 border-gray-200" },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "bg-red-50 text-red-600" },
  medium: { label: "Med", color: "bg-amber-50 text-amber-600" },
  low: { label: "Low", color: "bg-green-50 text-green-600" },
};

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const completerName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [hires, setHires] = useState<OnboardingHire[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedHire, setSelectedHire] = useState<OnboardingHire | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "overdue">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ChecklistTask | null>(null);
  const [newTask, setNewTask] = useState({ task_name: "", description: "", category: "general", assigned_to: "", assigned_to_role: "", due_date: "", priority: "medium" });
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [{ data: hr }, { data: tk }, { data: st }] = await Promise.all([
      supabase.from("onboarding_requests").select("*, employees(first_name, last_name, role, department, avatar_url)").order("created_at", { ascending: false }),
      supabase.from("onboarding_checklist_tasks").select("*").is("deleted_at", null).order("sort_order"),
      supabase.from("employees").select("id, first_name, last_name, department").eq("status", "active").order("first_name"),
    ]);
    const hiresData = (hr || []) as OnboardingHire[];
    setHires(hiresData);
    setTasks(tk || []);
    setStaff(st || []);
    if (!selectedHire && hiresData.length > 0) setSelectedHire(hiresData[0]);
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("checklist-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_checklist_tasks" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const getHireTasks = (hireId: string) => tasks.filter((t) => t.onboarding_request_id === hireId);

  const getProgress = (hireId: string) => {
    const t = getHireTasks(hireId);
    if (!t.length) return 0;
    return Math.round((t.filter((t) => t.completed).length / t.length) * 100);
  };

  const getCategoryProgress = (hireId: string, category: string) => {
    const ct = tasks.filter((t) => t.onboarding_request_id === hireId && t.category === category);
    if (!ct.length) return { completed: 0, total: 0, pct: 0 };
    const completed = ct.filter((t) => t.completed).length;
    return { completed, total: ct.length, pct: Math.round((completed / ct.length) * 100) };
  };

  const isOverdue = (task: ChecklistTask) => !task.completed && task.due_date && new Date(task.due_date + "T00:00:00") < new Date();

  const toggleTask = async (task: ChecklistTask) => {
    setToggling(task.id);
    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null,
        completed_by: !task.completed ? completerName : null,
      })
      .eq("id", task.id);
    setToggling(null);
    if (error) { setToast({ type: "error", message: "Failed to update task" }); return; }
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null, completed_by: !t.completed ? completerName : null } : t));
    setToast({ type: "success", message: task.completed ? "Task marked pending" : "Task completed!" });
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHire || !newTask.task_name) return;
    setSubmitting(true);
    const maxOrder = Math.max(0, ...getHireTasks(selectedHire.id).map((t) => t.sort_order));
    const { error } = await supabase.from("onboarding_checklist_tasks").insert({
      onboarding_request_id: selectedHire.id,
      task_name: newTask.task_name,
      description: newTask.description || null,
      category: newTask.category,
      assigned_to: newTask.assigned_to || null,
      assigned_to_role: newTask.assigned_to_role || null,
      due_date: newTask.due_date || null,
      priority: newTask.priority,
      sort_order: maxOrder + 1,
    });
    setSubmitting(false);
    if (error) { setToast({ type: "error", message: "Failed to add task" }); return; }
    setToast({ type: "success", message: "Task added successfully" });
    setShowAddModal(false);
    setNewTask({ task_name: "", description: "", category: "general", assigned_to: "", assigned_to_role: "", due_date: "", priority: "medium" });
  };

  const handleSaveTask = async () => {
    if (!selectedTask || !selectedTask.task_name.trim()) return;
    const { error } = await supabase.from("onboarding_checklist_tasks").update({
      task_name: selectedTask.task_name.trim(),
      description: selectedTask.description || null,
      category: selectedTask.category,
      priority: selectedTask.priority,
      due_date: selectedTask.due_date || null,
      assigned_to: selectedTask.assigned_to || null,
      assigned_to_role: selectedTask.assigned_to_role || null,
    }).eq("id", selectedTask.id);
    if (error) { setToast({ type: "error", message: "Failed to save task" }); return; }
    setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, ...selectedTask } : t));
    setToast({ type: "success", message: "Task updated" });
    setShowAssignModal(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (task: ChecklistTask) => {
    if (!confirm(`Delete task "${task.task_name}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
    const { error } = await supabase
      .from("onboarding_checklist_tasks")
      .update({ deleted_at: new Date().toISOString(), deleted_by: completerName })
      .eq("id", task.id);
    if (error) { setToast({ type: "error", message: "Failed to delete task" }); return; }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setToast({ type: "success", message: "Task moved to Recycle Bin" });
    setShowAssignModal(false);
    setSelectedTask(null);
  };

  const hireTasks = selectedHire ? getHireTasks(selectedHire.id) : [];
  const categories = [...new Set(hireTasks.map((t) => t.category))];

  const filteredTasks = (category: string) => {
    const ct = hireTasks.filter((t) => t.category === category);
    if (filterStatus === "all") return ct;
    if (filterStatus === "completed") return ct.filter((t) => t.completed);
    if (filterStatus === "pending") return ct.filter((t) => !t.completed && !isOverdue(t));
    if (filterStatus === "overdue") return ct.filter((t) => isOverdue(t));
    return ct;
  };

  const totalStats = {
    total: hireTasks.length,
    completed: hireTasks.filter((t) => t.completed).length,
    pending: hireTasks.filter((t) => !t.completed && !isOverdue(t)).length,
    overdue: hireTasks.filter((t) => isOverdue(t)).length,
  };

  const getName = (hire: OnboardingHire) => hire.employees ? `${hire.employees.first_name} ${hire.employees.last_name}` : `New Hire`;

  const staffDepartments = [...new Set(staff.map((s) => s.department).filter(Boolean))].sort();
  const staffFullName = (s: StaffMember) => `${s.first_name} ${s.last_name}`;
  const departmentForStaffName = (name: string) => staff.find((s) => staffFullName(s) === name)?.department || "";

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Left Panel - New Hires List */}
      <div className={`${selectedHire ? "hidden lg:flex" : "flex"} w-full lg:w-72 lg:shrink-0 border-r border-gray-100 flex-col overflow-hidden`}>
        <div className="p-5 border-b border-gray-100">
          <h1 className="text-[16px] font-bold text-gray-900">Onboarding Checklist</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">Track new hire task completion</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {hires.map((hire) => {
            const prog = getProgress(hire.id);
            const taskCount = getHireTasks(hire.id).length;
            const doneCount = getHireTasks(hire.id).filter((t) => t.completed).length;
            const isSelected = selectedHire?.id === hire.id;
            return (
              <button
                key={hire.id}
                onClick={() => setSelectedHire(hire)}
                className={`w-full text-left p-3.5 rounded-xl transition-all ${isSelected ? "bg-[#253C7D]/5 border border-[#253C7D]/20" : "hover:bg-gray-50 border border-transparent"}`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[12px] font-bold shrink-0">
                    {hire.employees ? `${hire.employees.first_name[0]}${hire.employees.last_name[0]}` : "NH"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{getName(hire)}</p>
                    <p className="text-[11px] text-gray-500 truncate">{hire.employees?.role || "New Employee"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${hire.status === "approved" ? "bg-blue-50 text-blue-700" : hire.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {hire.stage}
                  </span>
                  <span className="text-[11px] font-semibold text-[#253C7D]">{prog}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${prog === 100 ? "bg-green-500" : "bg-[#253C7D]"}`} style={{ width: `${prog}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">{doneCount}/{taskCount} tasks · Day {hire.day_count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className={`${selectedHire ? "flex" : "hidden lg:flex"} flex-1 flex-col overflow-hidden`}>
        {selectedHire ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedHire(null)}
                  className="lg:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <i className="ri-arrow-left-line text-lg" />
                </button>
                <div className="w-12 h-12 rounded-xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[15px] font-bold shrink-0">
                  {selectedHire.employees ? `${selectedHire.employees.first_name[0]}${selectedHire.employees.last_name[0]}` : "NH"}
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900">{getName(selectedHire)}</h2>
                  <p className="text-[12px] text-gray-500">{selectedHire.employees?.role} · {selectedHire.employees?.department} · Day {selectedHire.day_count}</p>
                </div>
                <span className={`text-[11px] font-semibold px-3 py-1 rounded-full capitalize ml-2 ${selectedHire.status === "approved" ? "bg-blue-50 text-blue-700" : selectedHire.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {selectedHire.status}
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap"
              >
                <i className="ri-add-line" /> Add Task
              </button>
            </div>

            {/* Stats bar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-3">
              {[
                { label: "Total", value: totalStats.total, color: "text-gray-700" },
                { label: "Completed", value: totalStats.completed, color: "text-green-600" },
                { label: "Pending", value: totalStats.pending, color: "text-amber-600" },
                { label: "Overdue", value: totalStats.overdue, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`text-[18px] font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-[12px] text-gray-400">{s.label}</span>
                </div>
              ))}
              <div className="hidden lg:block flex-1" />
              <div className="flex gap-1.5 flex-wrap">
                {(["all","completed","pending","overdue"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium capitalize transition-colors ${filterStatus === f ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist content */}
            <div className="flex-1 overflow-y-auto p-6">
              {hireTasks.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <i className="ri-checkbox-circle-line text-5xl mb-3 block" />
                  <p className="text-[14px]">No tasks yet</p>
                  <p className="text-[12px] mt-1">Add tasks to track onboarding progress</p>
                  <button onClick={() => setShowAddModal(true)} className="mt-4 px-4 py-2 bg-[#253C7D] text-white rounded-lg text-[12px] font-semibold">Add First Task</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {categories.map((cat) => {
                    const catMeta = CATEGORY_META[cat] || CATEGORY_META.general;
                    const catProg = getCategoryProgress(selectedHire.id, cat);
                    const catTasks = filteredTasks(cat);
                    return (
                      <div key={cat} className={`border rounded-xl overflow-hidden ${catMeta.color.split(" ").find((c) => c.startsWith("border")) || "border-gray-200"}`}>
                        <div className={`px-4 py-3 flex items-center justify-between ${catMeta.color.split(" ").filter((c) => c.startsWith("bg") || c.startsWith("text")).join(" ")}`}>
                          <div className="flex items-center gap-2">
                            <i className={`${catMeta.icon} text-base`} />
                            <span className="text-[13px] font-semibold">{catMeta.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-medium">{catProg.completed}/{catProg.total}</span>
                            <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden">
                              <div className="h-full bg-current opacity-70 rounded-full transition-all" style={{ width: `${catProg.pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white divide-y divide-gray-50">
                          {catTasks.length === 0 ? (
                            <p className="px-4 py-4 text-[12px] text-gray-400 text-center italic">No {filterStatus !== "all" ? filterStatus : ""} tasks</p>
                          ) : catTasks.map((task) => {
                            const overdue = isOverdue(task);
                            return (
                              <div key={task.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors ${overdue ? "bg-red-50/30" : ""}`}>
                                <button
                                  onClick={() => toggleTask(task)}
                                  disabled={toggling === task.id}
                                  className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${task.completed ? "bg-[#253C7D] border-[#253C7D]" : overdue ? "border-red-400 hover:border-red-500" : "border-gray-300 hover:border-[#253C7D]"} ${toggling === task.id ? "opacity-50" : ""}`}
                                >
                                  {task.completed && <i className="ri-check-line text-white text-[10px]" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[13px] font-medium ${task.completed ? "line-through text-gray-400" : overdue ? "text-red-700" : "text-gray-900"}`}>
                                      {task.task_name}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_META[task.priority]?.color || "bg-gray-50 text-gray-500"}`}>
                                      {PRIORITY_META[task.priority]?.label}
                                    </span>
                                    {overdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Overdue</span>}
                                  </div>
                                  {task.description && (
                                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    {task.assigned_to && (
                                      <button
                                        onClick={() => { setSelectedTask({ ...task }); setShowAssignModal(true); }}
                                        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#253C7D] transition-colors"
                                      >
                                        <i className="ri-user-line text-[11px]" />
                                        {task.assigned_to}
                                      </button>
                                    )}
                                    {!task.assigned_to && (
                                      <button
                                        onClick={() => { setSelectedTask({ ...task }); setShowAssignModal(true); }}
                                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#253C7D] transition-colors"
                                      >
                                        <i className="ri-user-add-line text-[11px]" /> Assign
                                      </button>
                                    )}
                                    {task.due_date && (
                                      <span className={`flex items-center gap-1 text-[11px] ${overdue ? "text-red-500" : "text-gray-400"}`}>
                                        <i className="ri-calendar-line text-[11px]" />
                                        {task.due_date}
                                      </span>
                                    )}
                                    {task.completed && task.completed_by && (
                                      <span className="text-[11px] text-green-600 flex items-center gap-1">
                                        <i className="ri-check-double-line text-[11px]" />
                                        {task.completed_by}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => { setSelectedTask({ ...task }); setShowAssignModal(true); }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#253C7D] transition-colors"
                                    title="Edit task"
                                  >
                                    <i className="ri-edit-line text-[13px]" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete task"
                                  >
                                    <i className="ri-delete-bin-line text-[13px]" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <i className="ri-user-add-line text-5xl mb-3 block" />
              <p className="text-[14px]">Select a new hire to view their checklist</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Add Checklist Task</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Task Name *</label>
                <input type="text" required value={newTask.task_name} onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]" placeholder="e.g. Sign NDA Agreement" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none" placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white">
                    <option value="documents">Documents</option>
                    <option value="it_setup">IT Setup</option>
                    <option value="training">Training</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Assign To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value, assigned_to_role: departmentForStaffName(e.target.value) || newTask.assigned_to_role })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={staffFullName(s)}>{staffFullName(s)} — {s.department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Role</label>
                  <select
                    value={newTask.assigned_to_role}
                    onChange={(e) => setNewTask({ ...newTask, assigned_to_role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                  >
                    <option value="">No department</option>
                    {staffDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Due Date</label>
                <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors disabled:opacity-50">{submitting ? "Adding..." : "Add Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Edit Task</h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedTask(null); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><i className="ri-close-line text-lg" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Task Name *</label>
                <input type="text" required value={selectedTask.task_name} onChange={(e) => setSelectedTask({ ...selectedTask, task_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={selectedTask.description || ""} onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })} rows={2} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={selectedTask.category} onChange={(e) => setSelectedTask({ ...selectedTask, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white">
                    <option value="documents">Documents</option>
                    <option value="it_setup">IT Setup</option>
                    <option value="training">Training</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select value={selectedTask.priority} onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Assign To</label>
                  <select
                    value={selectedTask.assigned_to || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to: e.target.value, assigned_to_role: departmentForStaffName(e.target.value) || selectedTask.assigned_to_role })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={staffFullName(s)}>{staffFullName(s)} — {s.department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Role</label>
                  <select
                    value={selectedTask.assigned_to_role || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assigned_to_role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                  >
                    <option value="">No department</option>
                    {staffDepartments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Due Date</label>
                <input type="date" value={selectedTask.due_date || ""} onChange={(e) => setSelectedTask({ ...selectedTask, due_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => handleDeleteTask(selectedTask)} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-50">
                <i className="ri-delete-bin-line mr-1" /> Delete
              </button>
              <button onClick={() => { setShowAssignModal(false); setSelectedTask(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveTask} className="flex-1 px-4 py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}