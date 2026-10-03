import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatTime, calcNetHours } from "../constants";

interface AttendanceRowPunchCellProps {
  record: AttendanceRecord;
  hasClockIn: boolean;
  hasClockOut: boolean;
  isRowFourPunch: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
}

export const AttendanceRowPunchCell = memo(function AttendanceRowPunchCell({
  record: r,
  hasClockIn,
  hasClockOut,
  isRowFourPunch,
  onEditRecord,
}: AttendanceRowPunchCellProps) {
  const netHours = calcNetHours(r.clock_in, r.clock_out, r.break_out, r.break_in, r.hours_worked);

  return (
    <td className="py-2.5 px-3 whitespace-nowrap">
      {isRowFourPunch ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 font-mono">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60">
              <i className="ri-sun-line text-amber-500 text-[11px]" />
              {r.clock_in ? formatTime(r.clock_in) : "—"}
            </span>
            <span className="text-gray-400 text-[11px]">→</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-orange-50 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200 border border-orange-200/80 dark:border-orange-800/60">
              <i className="ri-restaurant-line text-orange-500 text-[11px]" />
              {r.break_out ? formatTime(r.break_out) : "—"}
            </span>
            <button
              type="button"
              onClick={() => onEditRecord(r)}
              className="p-0.5 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit Punch"
            >
              <i className="ri-edit-line text-xs" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 font-mono">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/60">
              <i className="ri-cup-line text-indigo-500 text-[11px]" />
              {r.break_in ? formatTime(r.break_in) : "—"}
            </span>
            <span className="text-gray-400 text-[11px]">→</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border border-blue-200/80 dark:border-blue-800/60">
              <i className="ri-moon-line text-blue-500 text-[11px]" />
              {r.clock_out ? formatTime(r.clock_out) : "—"}
            </span>
          </div>
          {hasClockIn && hasClockOut && (
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.2 rounded">
                <i className="ri-check-double-line text-[11px]" /> Total: {netHours}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-slate-200 font-mono">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <i className="ri-time-line text-[#253C7D] dark:text-sky-400 text-[11px]" />
            {hasClockIn ? formatTime(r.clock_in) : "—"} - {hasClockOut ? formatTime(r.clock_out) : "—"}
          </span>
          {hasClockIn && hasClockOut && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
              {netHours}
            </span>
          )}
          <button
            type="button"
            onClick={() => onEditRecord(r)}
            className="p-0.5 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Punch"
          >
            <i className="ri-edit-line text-xs" />
          </button>
        </div>
      )}
    </td>
  );
});
