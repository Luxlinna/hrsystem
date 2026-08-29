import { memo } from "react";
import type { ChecklistTask } from "../../types";
import { CATEGORY_META, PRIORITY_META } from "../../constants";
import { isOverdue } from "../../checklistUtils";

interface ChecklistTaskItemProps {
  task: ChecklistTask;
  isLocked: boolean;
  toggling: string | null;
  completerName: string;
  onToggle: (task: ChecklistTask) => void;
  onQuickAssign: (task: ChecklistTask) => void;
  onEdit: (task: ChecklistTask) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: ChecklistTask) => void;
}

export const ChecklistTaskItem = memo(function ChecklistTaskItem({
  task,
  isLocked,
  toggling,
  completerName,
  onToggle,
  onQuickAssign,
  onEdit,
  onDelete,
  onViewDetails,
}: ChecklistTaskItemProps) {
  const isDone = task.completed;
  const overdue = isOverdue(task);
  const catMeta = CATEGORY_META[task.category] || CATEGORY_META.documents;
  const prioMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

  return (
    <div
      onClick={() => onViewDetails(task)}
      className={`p-3.5 rounded-2xl border transition-all text-xs flex items-start justify-between gap-3 cursor-pointer group ${
        isDone
          ? "bg-emerald-50/30 border-emerald-100/80 opacity-75"
          : overdue
          ? "bg-rose-50/40 border-rose-200"
          : isLocked
          ? "bg-gray-50/60 border-gray-100 opacity-60"
          : "bg-white border-gray-200/80 hover:bg-slate-50/80 shadow-2xs hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Completion Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task);
          }}
          disabled={toggling === task.id || task.assigned_to !== completerName}
          className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
            isDone
              ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs cursor-pointer"
              : task.assigned_to !== completerName
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-300 hover:border-[#253C7D] cursor-pointer"
          }`}
          title={
            task.assigned_to !== completerName
              ? task.assigned_to
                ? `Only ${task.assigned_to} can check this task`
                : "Please assign a staff member first"
              : isDone
              ? "Mark as pending"
              : "Mark as completed"
          }
        >
          {isDone && <i className="ri-check-line text-xs font-black" />}
          {task.assigned_to !== completerName && !isDone && <i className="ri-lock-line text-[10px]" />}
        </button>

        {/* Task Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className={`font-extrabold text-xs sm:text-[13px] truncate ${isDone ? "text-gray-400" : "text-gray-900"}`}>
              {task.task_name}
            </h5>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${catMeta.bg} ${catMeta.text} ${catMeta.border}`}>
              {catMeta.label}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${prioMeta.bg} ${prioMeta.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${prioMeta.dot}`} />
              {prioMeta.label}
            </span>
          </div>

          {task.description && (
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
              {task.description}
            </p>
          )}

          {/* Meta & Assignee Footer */}
          <div className="flex items-center gap-2.5 text-[10px] text-gray-400 mt-1.5 flex-wrap font-medium">
            {task.assigned_to ? (
              <span className="text-gray-600 font-semibold flex items-center gap-1">
                <i className="ri-user-line" />
                {task.assigned_to}
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAssign(task);
                }}
                className="text-[#253C7D] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <i className="ri-user-add-line" />
                Assign to me
              </button>
            )}

            {task.due_date && (
              <span className={overdue ? "text-rose-600 font-bold" : ""}>
                &middot; Due: {new Date(task.due_date).toLocaleDateString()} {overdue && "(Overdue)"}
              </span>
            )}

            {isDone && task.completed_by && (
              <span className="text-emerald-700 font-semibold">
                &middot; Completed by {task.completed_by}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="p-1.5 text-gray-400 hover:text-[#253C7D] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Edit"
        >
          <i className="ri-edit-line text-xs" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete"
        >
          <i className="ri-delete-bin-line text-xs" />
        </button>
      </div>
    </div>
  );
});
