import { memo } from "react";
import type { AttendanceRecord } from "../../types";
import { fmtHM } from "../../selfServiceUtils";

interface Props {
  shiftProgress: number | null;
  todayRecord: AttendanceRecord | null;
  elapsedHours: number;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  workStartTime: string;
  workEndTime: string | null;
}

export const LiveClockShiftSnapshot = memo(function LiveClockShiftSnapshot({
  shiftProgress,
  todayRecord,
  elapsedHours,
  isCheckedIn,
  isCheckedOut,
  workStartTime,
  workEndTime,
}: Props) {
  const clockInDisplay = todayRecord?.clock_in ? todayRecord.clock_in.slice(0, 5) : "—";
  const clockOutDisplay = todayRecord?.clock_out ? todayRecord.clock_out.slice(0, 5) : "—";
  const loggedDisplay = isCheckedOut && todayRecord?.hours_worked
    ? fmtHM(todayRecord.hours_worked)
    : isCheckedIn && elapsedHours > 0
    ? fmtHM(elapsedHours)
    : "—";

  return (
    <div className="flex-1 min-w-0 py-1 lg:px-4">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10.5px]">
          Today's Shift Schedule
        </span>
        <span className="text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
          {workStartTime || "08:00"} {workEndTime ? `– ${workEndTime}` : ""}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-3 overflow-hidden border border-slate-200 dark:border-slate-700">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isCheckedOut
              ? "bg-emerald-500"
              : isCheckedIn
              ? "bg-gradient-to-r from-[#253C7D] to-[#29ABE2]"
              : "bg-slate-300 dark:bg-slate-600"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, shiftProgress ?? (isCheckedIn ? 50 : 0)))}%` }}
        />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-2 text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">Punch In</span>
          <span className="text-[13px] sm:text-[14px] font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">{clockInDisplay}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-2 text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">Punch Out</span>
          <span className="text-[13px] sm:text-[14px] font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">{clockOutDisplay}</span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-2 text-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block tracking-wider">Logged</span>
          <span className="text-[13px] sm:text-[14px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{loggedDisplay}</span>
        </div>
      </div>
    </div>
  );
});

