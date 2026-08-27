import { memo, useState, useEffect } from "react";
import type { Task, FormState, Employee } from "../../types";
import { emptyForm } from "../../constants";
import { TaskMultiAssigneeSelect } from "./TaskMultiAssigneeSelect";
import { TaskOutsideWorkSection } from "./TaskOutsideWorkSection";

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface TaskFormModalProps {
  editingTask: Task | null;
  employees: Employee[];
  currentEmployeeId?: string | null;
  saving: boolean;
  onSave: (form: FormState, editId?: string) => void;
  onClose: () => void;
}

export const TaskFormModal = memo(function TaskFormModal({
  editingTask,
  employees,
  currentEmployeeId,
  saving,
  onSave,
  onClose,
}: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [owLocation, setOwLocation] = useState<LocationData | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description || "",
        assigned_to: editingTask.assigned_to,
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date || "",
        is_outside_work: editingTask.is_outside_work,
      });
      setAssignedIds(editingTask.assigned_to ? [editingTask.assigned_to] : []);
    } else {
      setForm(emptyForm);
      // Default to the current employee themselves if available!
      setAssignedIds(currentEmployeeId ? [currentEmployeeId] : []);
      setOwLocation(null);
      setMediaFiles([]);
    }
  }, [editingTask, currentEmployeeId]);

  const setDueDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setForm((prev) => ({ ...prev, due_date: dateStr }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || assignedIds.length === 0) return;

    if (assignedIds.length === 1) {
      onSave({ ...form, assigned_to: assignedIds[0] }, editingTask?.id);
    } else {
      assignedIds.forEach((id) => {
        onSave({ ...form, assigned_to: id });
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-base font-bold">
              <i className="ri-add-line" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h3>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done? e.g. Finalize Q3 Employee Review"
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Status Stage</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Priority Level</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TaskMultiAssigneeSelect employees={employees} selectedIds={assignedIds} onChange={setAssignedIds} />
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
              <div className="flex items-center gap-1.5 mt-1.5">
                <button type="button" onClick={() => setDueDateOffset(0)} className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600 cursor-pointer">Today</button>
                <button type="button" onClick={() => setDueDateOffset(1)} className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600 cursor-pointer">Tomorrow</button>
                <button type="button" onClick={() => setDueDateOffset(7)} className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-600 cursor-pointer">+7 Days</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Description &amp; Context</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add detailed task scope, requirements, or documentation links..."
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <TaskOutsideWorkSection
            isOutsideWork={form.is_outside_work}
            onToggleOutsideWork={(val) => setForm({ ...form, is_outside_work: val })}
            location={owLocation}
            onSetLocation={setOwLocation}
            mediaFiles={mediaFiles}
            onSetMediaFiles={setMediaFiles}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">Cancel</button>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || assignedIds.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1E3064] disabled:opacity-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <span>{saving ? "Saving..." : editingTask ? "Save Changes" : assignedIds.length > 1 ? `Create ${assignedIds.length} Tasks` : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
