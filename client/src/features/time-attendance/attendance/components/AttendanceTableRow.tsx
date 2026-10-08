import { memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatDMY } from "../exports";
import type { Holiday } from "@/services/holidays/holidaysService";
import type { ManagedShift } from "./shifts-manager/types";
import { resolveRecordSchedule } from "../utils/scheduleDisplayUtils";
import { parseTimeToMinutes } from "../constants";
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
  const isSunday = day === "Sun" || new Date(`${r.date}T00:00:00`).getDay() === 0;
  const isSaturday = day === "Sat" || new Date(`${r.date}T00:00:00`).getDay() === 6;

  const lastWindow = windows && windows.length > 0 ? windows[windows.length - 1] : null;
  const scheduledEndMin = lastWindow ? parseTimeToMinutes(lastWindow.time_out) : null;
  const clockOutMin = parseTimeToMinutes(r.clock_out);
  const isClockOutAfterScheduledEnd = clockOutMin != null && scheduledEndMin != null && clockOutMin >= scheduledEndMin;

  const isLate = r.status === "late" || (r.late_minutes != null && r.late_minutes > 0);
  const isEarlyLeave = !isClockOutAfterScheduledEnd && (
    (r.early_leave_minutes != null && r.early_leave_minutes > 0) ||
    (clockOutMin != null && scheduledEndMin != null && scheduledEndMin - clockOutMin > 5)
  );

  const badges: { label: string; bg: string; text: string }[] = [];
  if (r.status === "holiday" || isHoliday) {
    badges.push({ label: "Holiday", bg: "bg-blue-600", text: "text-white" });
  } else if (isSunday && !hasClockIn && !hasClockOut) {
    badges.push({ label: "Off", bg: "bg-purple-600 dark:bg-purple-700", text: "text-white" });
  } else if (isSaturday && !hasClockIn && !hasClockOut) {
    badges.push({ label: "Off", bg: "bg-slate-500 dark:bg-slate-600", text: "text-white" });
  } else if (!hasClockIn && !hasClockOut) {
    if (r.date > todayYMD) {
      badges.push({ label: "Scheduled", bg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700", text: "text-slate-600 dark:text-slate-300" });
    } else {
      badges.push({ label: "Off", bg: "bg-slate-400 dark:bg-slate-600", text: "text-white" });
    }
  } else if (!hasClockIn) {
    badges.push({ label: "Error : No clock in", bg: "bg-rose-500", text: "text-white" });
  } else if (!hasClockOut && r.date < todayYMD) {
    badges.push({ label: "Error : No clock out", bg: "bg-rose-500", text: "text-white" });
  } else if (!hasClockOut && r.date === todayYMD) {
    badges.push({ label: "Working Now", bg: "bg-emerald-600", text: "text-white" });
  } else {
    if (isLate) {
      badges.push({ label: `Late ${r.late_minutes ? `${r.late_minutes}m` : ""}`, bg: "bg-amber-500", text: "text-white" });
    }
    if (isEarlyLeave) {
      const earlyMins = (clockOutMin != null && scheduledEndMin != null && scheduledEndMin > clockOutMin)
        ? scheduledEndMin - clockOutMin
        : (r.early_leave_minutes || 0);
      badges.push({ label: `Early ${earlyMins}m`, bg: "bg-orange-500", text: "text-white" });
    }
  }

  const locationName = r.work_location?.name || emp?.branches?.name || "Main Office";

  return (
    <tr className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/80 text-xs ${
      isSunday ? "bg-purple-50/20 dark:bg-purple-950/10" : ""
    }`}>
      <td className="py-2.5 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(r.id)}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-700 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
      </td>

      <td className="py-2.5 px-2.5 text-left font-bold text-gray-400 dark:text-slate-500">
        {index + 1}
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <p className="font-bold text-gray-800 dark:text-slate-200 text-xs">{dmy}</p>
        <span className={`inline-block px-1.5 py-0.2 text-[10.5px] font-semibold rounded border ${
          isSunday ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700"
        }`}>
          {day}
        </span>
      </td>

      <AttendanceRowEmployeeCell record={r} employee={emp} onSelectRecord={onSelectRecord} />

      <td className="py-2.5 px-3 whitespace-nowrap">
        <p className="font-medium text-gray-800 dark:text-slate-200 text-xs truncate max-w-[150px]" title={emp?.position || emp?.role || "Staff Member"}>
          {emp?.position || emp?.role || "Staff Member"}
        </p>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <p className="font-medium text-gray-800 dark:text-slate-200 text-xs truncate max-w-[140px]" title={emp?.division || "—"}>
          {emp?.division || "—"}
        </p>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <p className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-tight text-xs">{emp?.department || "—"}</p>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10.5px] font-medium text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 max-w-[150px] truncate" title={locationName}>
          <i className="ri-building-line text-[10.5px] text-gray-400 dark:text-slate-500 shrink-0" />
          <span className="truncate">{locationName}</span>
        </span>
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap">
        <p className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1 leading-tight">
          <i className="ri-calendar-schedule-line text-[#253C7D] dark:text-sky-400 text-xs" />
          <span>{shiftTitle}</span>
        </p>
        <div className="space-y-0.5 mt-1 text-[11px] text-gray-600 dark:text-slate-400">
          {windows.map((w, i) => (
            <div key={w.id || i} className="flex items-center gap-1 leading-tight">
              <i className="ri-time-line text-gray-400 text-[10px]" />
              <span>{w.time_in} - {w.time_out}</span>
            </div>
          ))}
          <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 leading-tight">
            {Number(totalShiftHours).toFixed(2)} Hours
          </p>
        </div>
      </td>

      <AttendanceRowPunchCell record={r} hasClockIn={hasClockIn} hasClockOut={hasClockOut} isRowFourPunch={isRowFourPunch} onEditRecord={onEditRecord} />

      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-1 flex-wrap">
          {badges.map((b, idx) => (
            <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block shadow-2xs ${b.bg} ${b.text}`}>
              {b.label}
            </span>
          ))}
        </div>
      </td>

      <AttendanceRowActions record={r} canManage={canManage} onSelectRecord={onSelectRecord} onEditRecord={onEditRecord} onDeleteRecord={onDeleteRecord} onLogTimeForEmployee={onLogTimeForEmployee} />
    </tr>
  );
});
