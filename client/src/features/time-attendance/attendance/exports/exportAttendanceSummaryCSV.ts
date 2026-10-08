import type { EmployeeSummaryItem } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

export function exportAttendanceSummaryCSV(summaries: EmployeeSummaryItem[]): boolean {
  const headers = [
    "No.",
    "Employee Name",
    "Biometric ID",
    "Department",
    "Position",
    "Present Days",
    "Late Days",
    "Absent Days",
    "Remote Days",
    "Total Hours",
    "Total Late Minutes",
    "Attendance Rate",
    "Last Seen",
  ];

  const rows = summaries.map((s, idx) => {
    const empName = s.display_name?.trim() || s.full_name?.trim() || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";
    const rawBio = s.biometric_user_id || s.employee_code;
    const bName = Array.isArray(s.branches) ? s.branches[0]?.name : (s.branches?.name || s.site || "");
    const bioId = formatBiometricId(rawBio, bName) || "—";

    return [
      idx + 1,
      `"${empName.replace(/"/g, '""')}"`,
      `"${bioId.replace(/"/g, '""')}"`,
      `"${(s.department || "—").replace(/"/g, '""')}"`,
      `"${(s.position || s.role || "Staff").replace(/"/g, '""')}"`,
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

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_scorecard_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
