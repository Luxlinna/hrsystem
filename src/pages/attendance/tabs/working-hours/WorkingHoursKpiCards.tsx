import { memo } from "react";
import type { BranchScheduleData } from "./types";

interface Props {
  branch: BranchScheduleData;
}

export const WorkingHoursKpiCards = memo(function WorkingHoursKpiCards({ branch }: Props) {
  const startTime = branch.work_start_time ? branch.work_start_time.slice(0, 5) : "08:00";
  const endTime = branch.work_end_time ? branch.work_end_time.slice(0, 5) : "17:00";
  const lateGrace = branch.late_grace_minutes ?? 15;
  const earlyGrace = branch.early_leave_grace_minutes ?? 15;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Standard Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Working Hours
          </span>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {startTime} – {endTime}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              8h / day
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <i className="ri-calendar-line text-slate-400 text-xs" />
          <span>Mon – Fri (Full) · Sat (Half day)</span>
        </div>
      </div>

      {/* 2. Late Grace */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Late Arrival Grace
          </span>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {lateGrace} min
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              Tolerance
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Entries up to <span className="font-semibold text-slate-800 dark:text-slate-200">08:{String(lateGrace).padStart(2, "0")}</span> count as on-time
        </div>
      </div>

      {/* 3. Early Departure Grace */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Early Leave Grace
          </span>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {earlyGrace} min
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-[11px] font-semibold text-indigo-700 dark:text-indigo-400">
              Window
            </span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Checkouts after <span className="font-semibold text-slate-800 dark:text-slate-200">16:45</span> avoid penalty
        </div>
      </div>
    </div>
  );
});
