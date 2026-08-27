import { memo } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG, PRIORITY_META } from "../../constants";
import { formatDueDate, isOverdue, initials } from "../../taskUtils";
import { TaskOutsideWorkBadge } from "./TaskOutsideWorkBadge";

interface TaskTableRowProps {
  task: Task;
  onSelect: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (task: Task, newStatus: Task["status"]) => void;
}

export const TaskTableRow = memo(function TaskTableRow({
  task,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskTableRowProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  const priority = PRIORITY_META[task.priority];
  const overdue = isOverdue(task);
  const assigneeName = task.employees
    ? `${task.employees.first_name} ${task.employees.last_name}`
    : "Unassigned";

  return (
    <tr
      onClick={() => onSelect(task)}
      className="hover:bg-slate-50/80 transition-colors cursor-pointer border-b border-gray-100 text-xs"
    >
      {/* Title & Description */}
      <td className="px-4 py-3 min-w-[220px]">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task, task.status === "done" ? "todo" : "done");
            }}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
              task.status === "done"
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-gray-300 hover:border-[#253C7D]"
            }`}
          >
            {task.status === "done" && <i className="ri-check-line text-xs font-bold" />}
          </button>
          <div>
            <p
              className={`font-semibold ${
                task.status === "done" ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {task.title}
            </p>
            <TaskOutsideWorkBadge task={task} />
          </div>
        </div>
      </td>

      {/* Assignee */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {task.employees?.avatar_url ? (
            <img
              src={task.employees.avatar_url}
              alt={assigneeName}
              className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[10px] font-bold flex items-center justify-center">
              {initials(assigneeName)}
            </div>
          )}
          <span className="font-medium text-gray-800">{assigneeName}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusCfg.badge}`}
        >
          <i className={statusCfg.icon} />
          {statusCfg.label}
        </span>
      </td>

      {/* Priority */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}
        >
          <i className={priority.icon} />
          {priority.label}
        </span>
      </td>

      {/* Due Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        {task.due_date ? (
          <span
            className={`font-medium ${
              overdue ? "text-rose-600 font-semibold" : "text-gray-600"
            }`}
          >
            {formatDueDate(task.due_date)}
            {overdue && " (Overdue)"}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-1 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
          >
            <i className="ri-pencil-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(task)}
            title="Delete task"
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </td>
    </tr>
  );
});
