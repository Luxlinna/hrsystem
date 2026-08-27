import { memo } from "react";
import type { AddTaskForm } from "../../types";
import { TASK_TYPE_COLORS } from "../../constants";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTaskForm: AddTaskForm;
  setNewTaskForm: React.Dispatch<React.SetStateAction<AddTaskForm>>;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const AddTaskModal = memo(function AddTaskModal({
  isOpen,
  onClose,
  newTaskForm,
  setNewTaskForm,
  submitting,
  onSubmit,
}: AddTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Add Exit Checklist Item</h3>
            <p className="text-xs text-gray-400 mt-0.5">Assign a departmental handover or clearance task</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Task Description *
            </label>
            <input
              type="text"
              required
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              placeholder="e.g., Collect corporate building access key"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Department Type & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Department *
              </label>
              <select
                value={newTaskForm.type}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {Object.keys(TASK_TYPE_COLORS).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Assigned Team/Person *
              </label>
              <input
                type="text"
                required
                value={newTaskForm.assignee}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
                placeholder="e.g., IT Security"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={newTaskForm.due_date}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, due_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
