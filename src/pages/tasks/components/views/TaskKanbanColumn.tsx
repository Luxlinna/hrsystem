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
}

export const TaskKanbanColumn = memo(function TaskKanbanColumn({
  status,
  tasks,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onCheckInOut,
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
      // Find task from other columns passed by parent context
      onStatusChange({ id: taskId } as Task, status);
    } else {
      onStatusChange(task, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col bg-gray-50/70 rounded-2xl border ${
        isOver ? "border-[#253C7D] ring-2 ring-[#253C7D]/20 bg-blue-50/30" : cfg.border
      } p-3.5 min-h-[500px] transition-all`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <i className={`${cfg.icon} text-sm`} style={{ color: cfg.accent }} />
          <h3 className="text-sm font-bold text-gray-800">{cfg.label}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
          {tasks.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
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
          <div className="h-32 border-2 border-dashed border-gray-200/80 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
});
