import type { AttendanceRecord } from "../types";

export function exportAttendanceRecordsCSV(records: AttendanceRecord[]): boolean {
  const headers = [
    "Employee Name",
    "Department",
    "Location",
    "Date",
    "Clock In",
    "Clock Out",
    "Status",
    "Late Minutes",
    "Early Leave Minutes",
    "Notes",
  ];

  const rows = records.map((r) => {
    const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
    const dept = r.employees?.department || "—";
    const location = r.work_location?.name || r.employees?.branches?.name || "Main Office";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${location.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.clock_in || "—"}"`,
      `"${r.clock_out || "—"}"`,
      `"${(r.status || "present").toUpperCase()}"`,
      r.late_minutes || 0,
      r.early_leave_minutes || 0,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
