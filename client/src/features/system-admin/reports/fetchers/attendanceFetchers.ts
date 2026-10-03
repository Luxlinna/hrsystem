import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import {
  matchesEmployeeFilters,
  formatDateTime,
  formatClock,
  workedHours,
} from "../reportsUtils";
import { ATTENDANCE_STATUS_LABEL } from "../constants";
import type { ReportResult } from "./reportTypes";

const loadAttendanceRows = async (config: ReportConfig) => {
  let q = supabase
    .from("attendance_records")
    .select("id, employee_id, date, clock_in, clock_out, status, late_minutes, notes, deleted_at, deleted_by, employees(first_name, last_name, department, role, branches(name))")
    .order("date", { ascending: false });

  if (config.dateFrom) q = q.gte("date", config.dateFrom);
  if (config.dateTo) q = q.lte("date", config.dateTo);
  const { data, error } = await q;
  if (error) console.error("loadAttendanceRows error:", error);

  return (data || [])
    .map((r: any) => ({
      id: r.id,
      employee_id: r.employee_id,
      employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Unknown",
      department: r.employees?.department || "—",
      branch: r.employees?.branches?.name || "—",
      role: r.employees?.role || "—",
      date: r.date,
      clock_in: formatClock(r.clock_in),
      clock_out: formatClock(r.clock_out),
      hours: workedHours(r.clock_in, r.clock_out),
      status: ATTENDANCE_STATUS_LABEL[r.status] || r.status,
      late_minutes: r.late_minutes || 0,
      notes: r.notes || "",
      deleted_at: r.deleted_at || null,
      deleted_by: r.deleted_by || "—",
      deleted_at_formatted: formatDateTime(r.deleted_at),
    }))
    .filter((r) => matchesEmployeeFilters(r, config));
};

export const fetchAttendanceReport = async (config: ReportConfig): Promise<ReportResult> => {
  const mapped = await loadAttendanceRows(config);

  const cols = ["Employee", "Department", "Branch", "Role", "Date", "Check In", "Check Out", "Hours", "Status", "Late (Min)", "Deleted By", "Deleted Date & Time", "Notes"];

  const present = mapped.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "remote").length;
  const late = mapped.filter((r) => r.status === "late").length;
  const absent = mapped.filter((r) => r.status === "absent").length;
  const totalHours = mapped.reduce((sum, r) => sum + r.hours, 0);
  const deletedCount = mapped.filter((r) => Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Records": mapped.length,
    "On Time / Remote": present,
    "Late Arrivals": late,
    Absent: absent,
    "Hours Logged": +totalHours.toFixed(1),
    ...(deletedCount > 0 ? { "Deleted Records": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchAttendanceSummaryReport = async (config: ReportConfig): Promise<ReportResult> => {
  const records = await loadAttendanceRows(config);

  const map: Record<string, any> = {};
  records.forEach((r) => {
    const key = r.employee_id || r.employee;
    if (!map[key]) {
      map[key] = {
        id: key,
        employee: r.employee,
        department: r.department,
        branch: r.branch,
        role: r.role,
        days_logged: 0,
        present: 0,
        late: 0,
        absent: 0,
        remote: 0,
        total_hours: 0,
        late_minutes: 0,
        attendance_rate: 0,
        last_logged: r.date,
      };
    }
    const row = map[key];
    row.days_logged++;
    if (r.status === "ontime" || r.status === "present" || r.status === "remote") row.present++;
    if (r.status === "late") row.late++;
    if (r.status === "absent") row.absent++;
    if (r.status === "remote") row.remote++;
    row.total_hours += r.hours;
    row.late_minutes += r.late_minutes;
    if (r.date > row.last_logged) row.last_logged = r.date;
  });

  const mapped = Object.values(map)
    .map((r) => ({
      ...r,
      total_hours: +r.total_hours.toFixed(1),
      attendance_rate: r.days_logged > 0 ? Math.round(((r.present + r.late) / r.days_logged) * 100) : 0,
    }))
    .sort((a, b) => b.days_logged - a.days_logged || a.employee.localeCompare(b.employee));

  const cols = ["Employee", "Department", "Branch", "Role", "Days Logged", "On Time", "Late", "Absent", "Remote", "Total Hours", "Late Minutes", "Attendance Rate (%)", "Last Logged"];

  const totalHours = mapped.reduce((sum, r) => sum + r.total_hours, 0);
  const avgRate = mapped.length
    ? Math.round(mapped.reduce((sum, r) => sum + r.attendance_rate, 0) / mapped.length)
    : 0;
  const lateMinutes = mapped.reduce((sum, r) => sum + r.late_minutes, 0);

  const summary: Record<string, string | number> = {
    "Employees Analyzed": mapped.length,
    "Days Logged": mapped.reduce((sum, r) => sum + r.days_logged, 0),
    "Total Hours": +totalHours.toFixed(1),
    "Avg Attendance Rate": `${avgRate}%`,
    "Lost Late Time": `${Math.floor(lateMinutes / 60)}h ${lateMinutes % 60}m`,
  };

  return { rows: mapped, columns: cols, summary };
};
