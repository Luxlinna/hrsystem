import { memo } from "react";
import type { OffboardingTask } from "../../types";
import { TASK_TYPE_COLORS } from "../../constants";

interface OffboardingTaskListProps {
  tasks: OffboardingTask[];
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onOpenAddTaskModal: () => void;
}

export const OffboardingTaskList = memo(function OffboardingTaskList({
  tasks,
  onToggleTask,
  onOpenAddTaskModal,
}: OffboardingTaskListProps) {
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Exit Checklist ({completedCount}/{totalCount})
        </span>
        <button
          onClick={onOpenAddTaskModal}
          className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          <i className="ri-add-line" /> Add Task
        </button>
      </div>

      {/* Progress Mini Bar */}
      {totalCount > 0 && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-[#253C7D] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {tasks.map((task) => {
          const isDone = task.status === "completed";
          const typeColor = TASK_TYPE_COLORS[task.type] || TASK_TYPE_COLORS.IT;

          return (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id, task.status)}
              className={`p-2 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all cursor-pointer ${
                isDone
                  ? "bg-gray-50/60 border-gray-100 opacity-70"
                  : "bg-white border-gray-200/80 hover:bg-slate-50/80"
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-[#253C7D] cursor-pointer"
                />
                <div className="min-w-0">
                  <p className={`font-bold text-[11px] truncate ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {task.title}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">
                    Assignee: {task.assignee}
                  </p>
                </div>
              </div>

              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
                {task.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
