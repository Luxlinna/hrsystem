import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatTime, calcNetHours } from "../constants";

interface AttendanceRowPunchCellProps {
  record: AttendanceRecord;
  hasClockIn: boolean;
  hasClockOut: boolean;
  isRowFourPunch?: boolean;
  onEditRecord: (record: AttendanceRecord) => void;
}

export const AttendanceRowPunchCell = memo(function AttendanceRowPunchCell({
  record: r,
  hasClockIn,
  hasClockOut,
  onEditRecord,
}: AttendanceRowPunchCellProps) {
  const netHours = calcNetHours(r.clock_in, r.clock_out, null, null, r.hours_worked);

  return (
    <td className="py-2.5 px-3 whitespace-nowrap">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-slate-300 font-sans">
        <span className={hasClockIn ? "font-semibold text-gray-900 dark:text-slate-100" : "text-gray-400 dark:text-slate-500"}>
          {hasClockIn ? formatTime(r.clock_in) : "—"}
        </span>
        <span className="text-gray-400 text-[10px]">→</span>
        <span className={hasClockOut ? "font-semibold text-gray-900 dark:text-slate-100" : "text-gray-400 dark:text-slate-500"}>
          {hasClockOut ? formatTime(r.clock_out) : "—"}
        </span>
        {hasClockIn && hasClockOut && (
          <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400">
            ({netHours})
          </span>
        )}
        <button
          type="button"
          onClick={() => onEditRecord(r)}
          className="p-0.5 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ml-0.5"
          title="Edit Punch"
        >
          <i className="ri-edit-line text-[11px]" />
        </button>
      </div>
    </td>
  );
});
