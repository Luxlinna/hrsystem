import { memo } from "react";
import type { Task } from "../../types";
import { PRIORITY_META } from "../../constants";
import { formatDueDate, isOverdue, initials } from "../../taskUtils";
import { TaskOutsideWorkBadge } from "./TaskOutsideWorkBadge";

interface TaskCardProps {
  task: Task;
  onSelect: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onCheckInOut?: (task: Task, mode: "check_in" | "check_out") => void;
  isDragDisabled?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  onSelect,
  onEdit,
  onDelete,
  onCheckInOut,
}: TaskCardProps) {
  const priority = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const overdue = isOverdue(task);
  const assigneeName = task.employees
    ? `${task.employees.first_name} ${task.employees.last_name}`
    : "Unassigned";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task)}
      className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-2xs hover:shadow-md hover:border-gray-200 transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
    >
      {/* Top row: Outside Work & Priority */}
      <div className="flex items-center justify-between gap-2">
        <TaskOutsideWorkBadge task={task} />
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
        >
          <i className={priority.icon} />
          {priority.label}
        </span>
      </div>

      {/* Task title & description */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#253C7D] transition-colors">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer: Due date & Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs text-gray-500">
        {task.due_date ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              overdue ? "text-rose-600 font-semibold" : "text-gray-500"
            }`}
          >
            <i className={`ri-calendar-line ${overdue ? "text-rose-500" : "text-gray-400"}`} />
            {formatDueDate(task.due_date)}
            {overdue && " (Overdue)"}
          </span>
        ) : (
          <span className="text-[11px] text-gray-400">No deadline</span>
        )}

        <div className="flex items-center gap-1.5" title={assigneeName}>
          {task.employees?.avatar_url ? (
            <img
              src={task.employees.avatar_url}
              alt={assigneeName}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
              {initials(assigneeName)}
            </div>
          )}
          <span className="text-[11px] text-gray-600 max-w-[80px] truncate">{assigneeName}</span>
        </div>
      </div>
    </div>
  );
});
