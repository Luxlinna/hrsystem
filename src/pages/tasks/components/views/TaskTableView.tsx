import { memo } from "react";
import type { Task } from "../../types";
import { TaskTableRow } from "./TaskTableRow";

interface TaskTableViewProps {
  tasks: Task[];
  onSelect: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (task: Task, newStatus: Task["status"]) => void;
}

export const TaskTableView = memo(function TaskTableView({
  tasks,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskTableViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-task-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No tasks match your filter</p>
        <p className="text-xs text-gray-400 mt-1">Try clearing some filters or creating a new task.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tasks.map((task) => (
              <TaskTableRow
                key={task.id}
                task={task}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
