import { memo, useState } from "react";
import type { Task } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { TaskCard } from "./TaskCard";

interface TaskKanbanColumnProps {
  status: Task["status"];
  tasks: Task[];
  onSelect: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (task: Task, newStatus: Task["status"]) => void;
  onCheckInOut?: (task: Task, mode: "check_in" | "check_out") => void;
  onQuickCreate?: (status: Task["status"]) => void;
}

export const TaskKanbanColumn = memo(function TaskKanbanColumn({
  status,
  tasks,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onCheckInOut,
  onQuickCreate,
}: TaskKanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const cfg = STATUS_CONFIG[status];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      onStatusChange({ id: taskId } as Task, status);
    } else {
      onStatusChange(task, status);
    }
  };

  const dotColor =
    status === "todo"
      ? "bg-slate-400"
      : status === "in_progress"
      ? "bg-sky-500"
      : status === "blocked"
      ? "bg-rose-500"
      : "bg-emerald-500";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-white rounded-3xl border ${
        isOver ? "border-[#253C7D] ring-2 ring-[#253C7D]/20 bg-blue-50/20" : cfg.border
      } p-3.5 min-h-[500px] shadow-2xs transition-all`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">{cfg.label}</h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-600">
            {tasks.length}
          </span>
        </div>

        {onQuickCreate && (
          <button
            onClick={() => onQuickCreate(status)}
            className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer text-sm font-bold"
            title={`Add task to ${cfg.label}`}
          >
            <i className="ri-add-line" />
          </button>
        )}
      </div>

      {/* Cards list */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-290px)] pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onCheckInOut={onCheckInOut}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-44 border-2 border-dashed border-gray-200/80 rounded-2xl flex flex-col items-center justify-center text-center p-4">
            <i className="ri-inbox-line text-2xl text-gray-300 mb-1.5" />
            <p className="text-xs font-bold text-gray-400">No tasks in {cfg.label}</p>
            {onQuickCreate && (
              <button
                onClick={() => onQuickCreate(status)}
                className="mt-2 text-xs font-extrabold text-[#253C7D] hover:underline cursor-pointer"
              >
                + Create one
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
