import type { AttendanceRecord } from "../types";
import { formatTime } from "../constants";

interface AttendancePunchCellsProps {
  record: AttendanceRecord;
  isFourPunchMode: boolean;
}

export function AttendancePunchCells({ record: r, isFourPunchMode }: AttendancePunchCellsProps) {
  if (isFourPunchMode) {
    return (
      <>
        <td className="px-4 py-3.5 text-center whitespace-nowrap">
          {r.clock_in ? (
            <span className="font-bold text-amber-900 dark:text-amber-200 text-xs px-2.5 py-1 bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
              <i className="ri-sun-line text-amber-500 dark:text-amber-400 text-[11px]" />
              {formatTime(r.clock_in)}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-center whitespace-nowrap">
          {r.break_out ? (
            <span className="font-bold text-orange-900 dark:text-orange-200 text-xs px-2.5 py-1 bg-orange-50/90 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
              <i className="ri-restaurant-line text-orange-500 dark:text-orange-400 text-[11px]" />
              {formatTime(r.break_out)}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-center whitespace-nowrap">
          {r.break_in ? (
            <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs px-2.5 py-1 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
              <i className="ri-cup-line text-indigo-500 dark:text-indigo-400 text-[11px]" />
              {formatTime(r.break_in)}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-center whitespace-nowrap">
          {r.clock_out ? (
            <span className="font-bold text-blue-900 dark:text-blue-200 text-xs px-2.5 py-1 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 rounded-xl inline-flex items-center gap-1 shadow-2xs">
              <i className="ri-moon-line text-blue-500 dark:text-blue-400 text-[11px]" />
              {formatTime(r.clock_out)}
            </span>
          ) : (
            <span className="text-gray-300 dark:text-slate-600 font-extrabold text-sm select-none">—</span>
          )}
        </td>
      </>
    );
  }

  return (
    <>
      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800 dark:text-slate-100">
        {formatTime(r.clock_in)}
      </td>
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="font-bold text-gray-800 dark:text-slate-100">{formatTime(r.clock_out)}</span>
        {r.early_leave_minutes && r.early_leave_minutes > 0 ? (
          <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">({r.early_leave_minutes}m early)</span>
        ) : null}
      </td>
    </>
  );
}
