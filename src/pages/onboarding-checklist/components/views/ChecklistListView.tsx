import { memo } from "react";
import type { ChecklistTask } from "../../types";
import { ChecklistTaskItem } from "./ChecklistTaskItem";

interface ChecklistListViewProps {
  tasks: ChecklistTask[];
  isTaskLocked: (task: ChecklistTask) => boolean;
  toggling: string | null;
  completerName: string;
  onToggle: (task: ChecklistTask) => void;
  onQuickAssign: (task: ChecklistTask) => void;
  onEdit: (task: ChecklistTask) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: ChecklistTask) => void;
}

export const ChecklistListView = memo(function ChecklistListView({
  tasks,
  isTaskLocked,
  toggling,
  completerName,
  onToggle,
  onQuickAssign,
  onEdit,
  onDelete,
  onViewDetails,
}: ChecklistListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-task-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Checklist Tasks Found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No tasks match the active search filter, category, priority, or status selections.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {tasks.map((task) => (
        <ChecklistTaskItem
          key={task.id}
          task={task}
          isLocked={isTaskLocked(task)}
          toggling={toggling}
          completerName={completerName}
          onToggle={onToggle}
          onQuickAssign={onQuickAssign}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
});
