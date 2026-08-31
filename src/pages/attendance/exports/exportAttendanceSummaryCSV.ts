import type { EmployeeSummaryItem } from "../types";

export function exportAttendanceSummaryCSV(summaries: EmployeeSummaryItem[]): boolean {
  const headers = [
    "Employee Name",
    "Department",
    "Role",
    "Present Days",
    "Late Days",
    "Absent Days",
    "Remote Days",
    "Total Hours",
    "Total Late Minutes",
    "Attendance Rate",
    "Last Seen",
  ];

  const rows = summaries.map((s) => {
    const empName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${(s.department || "—").replace(/"/g, '""')}"`,
      `"${(s.role || "Staff").replace(/"/g, '""')}"`,
      s.present || 0,
      s.late || 0,
      s.absent || 0,
      s.remote || 0,
      Number(s.totalHours || 0).toFixed(1),
      s.totalLateMinutes || 0,
      `"${Math.round(s.attendanceRate || 0)}%"`,
      `"${(s.lastSeen || "—").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_scorecard_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
