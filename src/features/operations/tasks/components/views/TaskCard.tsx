import { memo } from "react";
import type { Task } from "../../types";
import { PRIORITY_META } from "../../constants";
import { formatDueDate, isOverdue, initials } from "../../taskUtils";

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
}: TaskCardProps) {
  const priority = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const overdue = isOverdue(task);
  const assigneeName = task.employees
    ? `${task.employees.first_name} ${task.employees.last_name}`
    : "Unassigned";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
  };

  const isDone = task.status === "done";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect(task)}
      className="bg-white rounded-2xl p-3.5 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group space-y-2.5"
    >
      {/* Top row: Priority & Status Circle */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${priority.bg} ${priority.text} border ${priority.border}`}
        >
          <i className={priority.icon} />
          <span>{priority.label}</span>
        </span>

        {isDone ? (
          <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
        ) : (
          <span className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-gray-400 transition-colors" />
        )}
      </div>

      {/* Task title & description */}
      <div>
        <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#253C7D] transition-colors">
          {task.title}
        </h4>
        {!isDone && task.description && (
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Mid row: Assignee & Due Date */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-1.5 min-w-0" title={assigneeName}>
          {task.employees?.avatar_url ? (
            <img
              src={task.employees.avatar_url}
              alt={assigneeName}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100 shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#253C7D] text-white text-[9px] font-black flex items-center justify-center shrink-0">
              {initials(assigneeName)}
            </div>
          )}
          <span className="text-[11px] font-semibold text-gray-700 truncate">{assigneeName}</span>
        </div>

        {task.due_date && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
              overdue
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : task.due_date === new Date().toISOString().slice(0, 10)
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <i className="ri-calendar-line text-[10px]" />
            {formatDueDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Outside Work Field Tag */}
      {task.is_outside_work && (
        <div className="pt-1 border-t border-gray-100 flex items-center gap-1.5 text-[10px] font-bold">
          {task.work_status === "checked_in" ? (
            <span className="text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Checked in &middot; {task.work_checked_in_at ? new Date(task.work_checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Active"}</span>
            </span>
          ) : (
            <span className="text-amber-700 flex items-center gap-1">
              <i className="ri-map-pin-line text-amber-600" />
              <span>Outside work</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
});
