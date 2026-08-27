import { memo } from "react";
import type { Task } from "../../types";
import { STATUS_COLUMNS } from "../../constants";
import { TaskKanbanColumn } from "./TaskKanbanColumn";

interface TaskBoardViewProps {
  tasks: Task[];
  onSelect: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (task: Task, newStatus: Task["status"]) => void;
  onCheckInOut?: (task: Task, mode: "check_in" | "check_out") => void;
}

export const TaskBoardView = memo(function TaskBoardView({
  tasks,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onCheckInOut,
}: TaskBoardViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <TaskKanbanColumn
            key={col.key}
            status={col.key}
            tasks={colTasks}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onCheckInOut={onCheckInOut}
          />
        );
      })}
    </div>
  );
});
