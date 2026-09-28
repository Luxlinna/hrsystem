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
    <td className="py-3 px-4 whitespace-nowrap">
      {isRowFourPunch ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
            <span>
              {r.clock_in ? formatTime(r.clock_in) : "N/A"} -{" "}
              {r.break_out ? formatTime(r.break_out) : "N/A"}
            </span>
            <button
              type="button"
              onClick={() => onEditRecord(r)}
              className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
              title="Edit Punch"
            >
              <i className="ri-edit-line text-xs" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
            <span>
              {r.break_in ? formatTime(r.break_in) : "N/A"} -{" "}
              {r.clock_out ? formatTime(r.clock_out) : "N/A"}
            </span>
            <button
              type="button"
              onClick={() => onEditRecord(r)}
              className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
              title="Edit Punch"
            >
              <i className="ri-edit-line text-xs" />
            </button>
          </div>
          {hasClockIn && hasClockOut && (
            <div className="pt-0.5">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shadow-2xs">
                Total: {netHours}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-slate-300 text-[11px]">
          <span>
            {hasClockIn ? formatTime(r.clock_in) : "N/A"} -{" "}
            {hasClockOut ? formatTime(r.clock_out) : "N/A"}
          </span>
          {hasClockIn && hasClockOut && (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded shadow-2xs">
              {netHours}
            </span>
          )}
          <button
            type="button"
            onClick={() => onEditRecord(r)}
            className="text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
            title="Edit Punch"
          >
            <i className="ri-edit-line text-xs" />
          </button>
        </div>
      )}
    </td>
  );
});
