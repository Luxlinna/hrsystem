import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatDMY } from "../exports";
import type { Holiday } from "@/services/holidays/holidaysService";
import type { ManagedShift } from "./shifts-manager/types";
import { resolveRecordSchedule } from "../utils/scheduleDisplayUtils";
import { AttendanceRowPunchCell } from "./AttendanceRowPunchCell";
import { AttendanceRowActions } from "./AttendanceRowActions";
import { AttendanceRowEmployeeCell } from "./AttendanceRowEmployeeCell";

interface AttendanceTableRowProps {
  record: AttendanceRecord;
  index: number;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
  canManage: boolean;
  isFourPunchMode: boolean;
  holidayMap?: Map<string, Holiday>;
  shifts?: ManagedShift[];
  todayYMD: string;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

export const AttendanceTableRow = memo(function AttendanceTableRow({
  record: r,
  index,
  isSelected,
  onToggleSelect,
  canManage,
  isFourPunchMode,
  holidayMap,
  shifts = [],
  todayYMD,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceTableRowProps) {
  const emp = r.employees;
  const { dmy, day } = formatDMY(r.date);
  const { shiftTitle, windows, totalShiftHours } = resolveRecordSchedule(r, emp, shifts);
  const hasClockIn = Boolean(r.clock_in);
  const hasClockOut = Boolean(r.clock_out);
  const isRowFourPunch = Boolean(isFourPunchMode && (r.work_location?.is_four_punch_enabled ?? true));
  const isHoliday = holidayMap?.has(r.date);

  let statusBadge: { label: string; bg: string; text: string } | null = null;
  if (isHoliday) statusBadge = { label: "Holiday", bg: "bg-blue-600", text: "text-white" };
  else if (!hasClockIn) statusBadge = { label: "Error : No clock in", bg: "bg-rose-500", text: "text-white" };
  else if (!hasClockOut && r.date < todayYMD) statusBadge = { label: "Error : No clock out", bg: "bg-rose-500", text: "text-white" };
  else if (!hasClockOut && r.date === todayYMD) statusBadge = { label: "Working Now", bg: "bg-emerald-600", text: "text-white" };
  else if (r.status === "late" || (r.late_minutes && r.late_minutes > 0)) statusBadge = { label: `Late ${r.late_minutes}m`, bg: "bg-amber-500", text: "text-white" };
  else if (r.early_leave_minutes && r.early_leave_minutes > 0) statusBadge = { label: `Early ${r.early_leave_minutes}m`, bg: "bg-orange-500", text: "text-white" };

  const locationName = r.work_location?.name || emp?.branches?.name || "Main Office";

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/80 text-xs">
      <td className="py-3 px-3.5 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(r.id)}
          className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
      </td>

      <td className="py-3 px-3 text-left font-bold text-gray-400 dark:text-slate-500">
        {index + 1}
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        <p className="font-semibold text-gray-800 dark:text-slate-200">{dmy}</p>
        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-md">
          {day}
        </span>
      </td>

      <AttendanceRowEmployeeCell
        record={r}
        employee={emp}
        onSelectRecord={onSelectRecord}
      />

      <td className="py-3 px-4 whitespace-nowrap">
        <span className="text-gray-700 dark:text-slate-300 font-medium">
          {emp?.role || "Staff Member"}
        </span>
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        <p className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-tight text-[11px]">
          {emp?.department || "OPERATIONS"}
        </p>
        <span
          className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 max-w-[150px] truncate"
          title={locationName}
        >
          <i className="ri-building-line text-[10px] text-gray-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">{locationName}</span>
        </span>
      </td>

      <td className="py-3 px-4 whitespace-nowrap">
        <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">{shiftTitle}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {windows.map((w, i) => (
            <span
              key={w.id || i}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300"
            >
              {w.time_in} - {w.time_out}
            </span>
          ))}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-pink-200/90 dark:bg-pink-900/60 text-pink-900 dark:text-pink-200">
            {Number(totalShiftHours).toFixed(2)} Hours
          </span>
        </div>
      </td>

      <AttendanceRowPunchCell
        record={r}
        hasClockIn={hasClockIn}
        hasClockOut={hasClockOut}
        isRowFourPunch={isRowFourPunch}
        onEditRecord={onEditRecord}
      />

      <td className="py-3 px-4 whitespace-nowrap">
        {statusBadge && (
          <span className={`px-2.5 py-1 rounded text-[11px] font-bold inline-block shadow-2xs ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
        )}
      </td>

      <AttendanceRowActions
        record={r}
        canManage={canManage}
        onSelectRecord={onSelectRecord}
        onEditRecord={onEditRecord}
        onDeleteRecord={onDeleteRecord}
        onLogTimeForEmployee={onLogTimeForEmployee}
      />
    </tr>
  );
});
