import type { Employee, AttendanceRecord } from "../types";

export function exportSelfAttendanceCSV(
  records: AttendanceRecord[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Date", "Clock In", "Clock Out", "Hours Worked", "Late Minutes", "Early Leave Minutes", "Status", "Notes"];

  const rows = records.map((r) => [
    `"${empName.replace(/"/g, '""')}"`,
    `"${r.date}"`,
    `"${r.clock_in || ""}"`,
    `"${r.clock_out || ""}"`,
    r.hours_worked != null ? r.hours_worked : 0,
    r.late_minutes || 0,
    r.early_leave_minutes || 0,
    `"${r.status}"`,
    `"${(r.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
