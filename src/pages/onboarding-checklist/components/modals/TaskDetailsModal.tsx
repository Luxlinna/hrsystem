import { memo } from "react";
import type { ChecklistTask } from "../../types";
import { CATEGORY_META, PRIORITY_META } from "../../constants";
import { isOverdue } from "../../checklistUtils";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingTask: ChecklistTask | null;
  onEdit: (task: ChecklistTask) => void;
}

export const TaskDetailsModal = memo(function TaskDetailsModal({
  isOpen,
  onClose,
  viewingTask,
  onEdit,
}: TaskDetailsModalProps) {
  if (!isOpen || !viewingTask) return null;

  const catMeta = CATEGORY_META[viewingTask.category] || CATEGORY_META.documents;
  const prioMeta = PRIORITY_META[viewingTask.priority] || PRIORITY_META.medium;
  const overdue = isOverdue(viewingTask);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}>
              {catMeta.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${prioMeta.bg} ${prioMeta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prioMeta.dot}`} />
              {prioMeta.label} Priority
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <h3 className="text-base font-extrabold text-gray-900 mb-2">{viewingTask.task_name}</h3>

        {viewingTask.description && (
          <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-4 leading-relaxed">
            {viewingTask.description}
          </p>
        )}

        <div className="space-y-2 text-xs border-t border-gray-100 pt-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Status:</span>
            <span
              className={`font-extrabold ${
                viewingTask.completed
                  ? "text-emerald-600"
                  : overdue
                  ? "text-rose-600 font-black"
                  : "text-amber-600"
              }`}
            >
              {viewingTask.completed ? "Completed" : overdue ? "Overdue" : "Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Assignee:</span>
            <span className="font-bold text-gray-800">{viewingTask.assigned_to || "Unassigned"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Due Date:</span>
            <span className={`font-bold ${overdue ? "text-rose-600" : "text-gray-800"}`}>
              {viewingTask.due_date ? new Date(viewingTask.due_date).toLocaleDateString() : "No deadline set"}
            </span>
          </div>

          {viewingTask.completed_by && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">Completed By:</span>
              <span className="font-bold text-emerald-700">{viewingTask.completed_by}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              onEdit(viewingTask);
            }}
            className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E3064] transition-colors cursor-pointer"
          >
            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
});
