import type { AttendanceRecord } from "../types";
import { formatTime, calcNetHours } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";
import { resolveRecordSchedule } from "../utils/scheduleDisplayUtils";
import type { ManagedShift } from "../components/shifts-manager/types";

export interface AttendanceExportRow {
  no: number;
  dateStr: string;
  dayOfWeek: string;
  employeeName: string;
  biometricId: string;
  position: string;
  division: string;
  department: string;
  location: string;
  scheduleTitle: string;
  scheduleWindows: string;
  scheduledHours: string;
  clockIn: string;
  clockOut: string;
  breakOut: string;
  breakIn: string;
  workedHours: string;
  status: string;
  notes: string;
}

export function formatDMY(dateStr: string): { dmy: string; day: string } {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return { dmy: dateStr, day: "" };
  return {
    dmy: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`,
    day: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

export function getExportStatus(r: AttendanceRecord): string {
  const todayYMD = new Date().toISOString().slice(0, 10);
  const hasClockIn = Boolean(r.clock_in);
  const hasClockOut = Boolean(r.clock_out);

  if (r.status === "holiday") return "Holiday";
  if (!hasClockIn && !hasClockOut) return "Error : No clock in";
  if (!hasClockIn) return "Error : No clock in";
  if (!hasClockOut && r.date < todayYMD) return "Error : No clock out";
  if (!hasClockOut && r.date === todayYMD) return "Working Now";
  
  const statuses: string[] = [];
  if (r.status === "late" || (r.late_minutes && r.late_minutes > 0)) {
    statuses.push(`Late ${r.late_minutes}m`);
  }
  if (r.early_leave_minutes && r.early_leave_minutes > 0) {
    statuses.push(`Early ${r.early_leave_minutes}m`);
  }
  if (statuses.length > 0) return statuses.join(", ");

  if (r.status === "remote") return "Remote";
  if (r.status === "absent") return "Absent";
  return "";
}

export function mapRecordToExportRow(
  r: AttendanceRecord,
  index: number,
  shifts: ManagedShift[] = []
): AttendanceExportRow {
  const emp = r.employees;
  const { dmy, day } = formatDMY(r.date);
  const sched = resolveRecordSchedule(r, emp, shifts);

  const rawBio = emp?.biometric_user_id || emp?.employee_code;
  const bName = Array.isArray(emp?.branches)
    ? emp?.branches[0]?.name
    : (emp?.branches?.name || r.work_location?.name || "");
  const bioId = formatBiometricId(rawBio, bName) || "—";

  const windowsText = sched.windows.map((w) => `${w.time_in} - ${w.time_out}`).join(", ");
  const netHours = calcNetHours(r.clock_in, r.clock_out, r.break_out, r.break_in, r.hours_worked);

  return {
    no: index + 1,
    dateStr: dmy,
    dayOfWeek: day,
    employeeName: `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee",
    biometricId: bioId,
    position: emp?.position || emp?.role || "Staff Member",
    division: emp?.division || "—",
    department: emp?.department || "OPERATIONS",
    location: r.work_location?.name || emp?.branches?.name || emp?.site || "Main Office",
    scheduleTitle: sched.shiftTitle,
    scheduleWindows: windowsText,
    scheduledHours: `${Number(sched.totalShiftHours).toFixed(2)} Hours`,
    clockIn: r.clock_in ? formatTime(r.clock_in) : "N/A",
    clockOut: r.clock_out ? formatTime(r.clock_out) : "N/A",
    breakOut: r.break_out ? formatTime(r.break_out) : "N/A",
    breakIn: r.break_in ? formatTime(r.break_in) : "N/A",
    workedHours: netHours !== "—" ? netHours : "0h",
    status: getExportStatus(r),
    notes: r.notes || "—",
  };
}
