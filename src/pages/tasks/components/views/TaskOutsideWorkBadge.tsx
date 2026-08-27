import { memo } from "react";
import type { Task } from "../../types";

interface TaskOutsideWorkBadgeProps {
  task: Task;
}

export const TaskOutsideWorkBadge = memo(function TaskOutsideWorkBadge({
  task,
}: TaskOutsideWorkBadgeProps) {
  if (!task.is_outside_work) return null;

  const isCheckedIn = task.work_status === "checked_in";
  const isCheckedOut = task.work_status === "checked_out";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
        <i className="ri-map-pin-line text-[10px]" />
        Outside Work
      </span>

      {isCheckedIn && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Checked In
        </span>
      )}

      {isCheckedOut && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
          <i className="ri-check-double-line text-[10px]" />
          Checked Out
        </span>
      )}
    </div>
  );
});
