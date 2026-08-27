import { memo, useMemo } from "react";
import type { ChecklistTask } from "../../types";
import { isOverdue } from "../../checklistUtils";
import { ChecklistTaskItem } from "./ChecklistTaskItem";

interface ChecklistUrgencyViewProps {
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

export const ChecklistUrgencyView = memo(function ChecklistUrgencyView({
  tasks,
  isTaskLocked,
  toggling,
  completerName,
  onToggle,
  onQuickAssign,
  onEdit,
  onDelete,
  onViewDetails,
}: ChecklistUrgencyViewProps) {
  const groups = useMemo(() => {
    const overdueList = tasks.filter((t) => isOverdue(t));
    const highPrio = tasks.filter((t) => !t.completed && !isOverdue(t) && t.priority === "high");
    const upcoming = tasks.filter((t) => !t.completed && !isOverdue(t) && t.priority !== "high");
    const completedList = tasks.filter((t) => t.completed);

    return [
      { key: "overdue", label: "Overdue Items", items: overdueList, color: "text-rose-600 bg-rose-50 border-rose-200" },
      { key: "high", label: "High Priority Pending", items: highPrio, color: "text-amber-700 bg-amber-50 border-amber-200" },
      { key: "upcoming", label: "Upcoming & Scheduled", items: upcoming, color: "text-sky-700 bg-sky-50 border-sky-200" },
      { key: "completed", label: "Completed Items", items: completedList, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    ].filter((g) => g.items.length > 0);
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <p className="font-extrabold text-sm text-gray-800">No Urgency Tasks Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key} className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${group.color}`}>
              {group.label} ({group.items.length})
            </span>
          </div>

          <div className="space-y-2">
            {group.items.map((task) => (
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
        </div>
      ))}
    </div>
  );
});
