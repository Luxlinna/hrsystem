import type { AttendanceRecord } from "../types";
import { STATUS_CONFIG } from "../constants";
import type { Holiday } from "@/services/holidays/holidaysService";

export interface AttendanceStatusDisplay {
  statusLabel: string;
  statusBg: string;
  statusText: string;
  statusBorder: string;
  statusIcon: string;
  isPulse: boolean;
}

export function getAttendanceLiveStatus(
  r: AttendanceRecord,
  todayYMD: string,
  isFourPunchMode: boolean,
  holidayMap: Map<string, Holiday>
): AttendanceStatusDisplay {
  const isToday = r.date === todayYMD;
  const isOutsideWork = r.notes?.toLowerCase().includes("outside work");

  if (isOutsideWork) {
    const isClockedOut = Boolean(r.clock_out);
    return {
      statusLabel: "Outside Working",
      statusBg: "bg-teal-50 dark:bg-teal-950/60",
      statusText: "text-teal-700 dark:text-teal-300",
      statusBorder: "border-teal-200 dark:border-teal-800/60",
      statusIcon: isClockedOut ? "ri-checkbox-circle-line" : "ri-map-pin-user-line",
      isPulse: !isClockedOut,
    };
  }

  if (isToday) {
    if (isFourPunchMode && r.break_out && !r.break_in) {
      return {
        statusLabel: "Lunch Break",
        statusBg: "bg-orange-50 dark:bg-orange-950/60",
        statusText: "text-orange-700 dark:text-orange-300",
        statusBorder: "border-orange-200 dark:border-orange-800/60",
        statusIcon: "ri-restaurant-line",
        isPulse: true,
      };
    }
    if (isFourPunchMode && r.break_in && !r.clock_out) {
      return {
        statusLabel: "Working (PM)",
        statusBg: "bg-sky-50 dark:bg-sky-950/60",
        statusText: "text-sky-700 dark:text-sky-300",
        statusBorder: "border-sky-200 dark:border-sky-800/60",
        statusIcon: "ri-time-line",
        isPulse: true,
      };
    }
    if (r.clock_in && !r.clock_out && (!isFourPunchMode || !r.break_out)) {
      const isLate = r.status === "late" || Boolean(r.late_minutes && r.late_minutes > 0);
      return {
        statusLabel: isLate ? `Late Arrival (${r.late_minutes || 0}m)` : "Working Now",
        statusBg: isLate ? "bg-amber-50 dark:bg-amber-950/60" : "bg-emerald-50 dark:bg-emerald-950/60",
        statusText: isLate ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
        statusBorder: isLate ? "border-amber-200 dark:border-amber-800/60" : "border-emerald-200 dark:border-emerald-800/60",
        statusIcon: "ri-time-line",
        isPulse: !isLate,
      };
    }
  }

  const holiday = holidayMap.get(r.date);
  if (r.status === "holiday" || (!r.clock_in && holiday)) {
    return {
      statusLabel: holiday ? `Holiday: ${holiday.name}` : "Holiday / Off",
      statusBg: "bg-purple-50 dark:bg-purple-950/60",
      statusText: "text-purple-700 dark:text-purple-300",
      statusBorder: "border-purple-200 dark:border-purple-800/60",
      statusIcon: "ri-calendar-event-line",
      isPulse: false,
    };
  }

  if (r.clock_in && holiday) {
    return {
      statusLabel: "Holiday Work (2.0x OT)",
      statusBg: "bg-purple-50 dark:bg-purple-950/60",
      statusText: "text-purple-700 dark:text-purple-300",
      statusBorder: "border-purple-200 dark:border-purple-800/60",
      statusIcon: "ri-scales-3-line",
      isPulse: false,
    };
  }

  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.ontime || STATUS_CONFIG.present;
  const labelWithMinutes = cfg.label + (r.status === "late" && r.late_minutes && r.late_minutes > 0 ? ` (${r.late_minutes}m)` : "");

  return {
    statusLabel: labelWithMinutes,
    statusBg: cfg.bg,
    statusText: cfg.text,
    statusBorder: cfg.border,
    statusIcon: cfg.icon,
    isPulse: false,
  };
}
