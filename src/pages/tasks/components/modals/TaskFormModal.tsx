import { memo, useState, useEffect } from "react";
import type { Task, FormState, Employee } from "../../types";
import { emptyForm } from "../../constants";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface TaskFormModalProps {
  editingTask: Task | null;
  employees: Employee[];
  saving: boolean;
  onSave: (form: FormState, editId?: string) => void;
  onClose: () => void;
}

export const TaskFormModal = memo(function TaskFormModal({
  editingTask,
  employees,
  saving,
  onSave,
  onClose,
}: TaskFormModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

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
    } else {
      setForm(emptyForm);
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigned_to) return;
    onSave(form, editingTask?.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Conduct client site survey"
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 focus:border-[#253C7D]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add details, instructions, or goals..."
              className="w-full px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 focus:border-[#253C7D]"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Assign To <span className="text-rose-500">*</span>
            </label>
            <EmployeeSearchSelect
              employees={employees}
              value={form.assigned_to}
              onChange={(val) => setForm({ ...form, assigned_to: val })}
              placeholder="Search employee..."
            />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Task["priority"] })
                }
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Task["status"] })
                }
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Outside field work toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
            <div>
              <h5 className="text-xs font-bold text-indigo-900">Outside Field Work</h5>
              <p className="text-[11px] text-indigo-600">Requires GPS check-in/out &amp; photo evidence</p>
            </div>
            <input
              type="checkbox"
              checked={form.is_outside_work}
              onChange={(e) => setForm({ ...form, is_outside_work: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.assigned_to}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {editingTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
