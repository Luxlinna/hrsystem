import type { EmployeeSummaryItem } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAttendanceSummaryXLSX(summaries: EmployeeSummaryItem[]): Promise<boolean> {
  const data = summaries.length > 0
    ? summaries.map((s) => {
        const empName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";

        return {
          "Employee ID": s.id,
          "Employee Name": empName,
          Department: s.department || "—",
          Role: s.role || "Staff",
          "Present Days": s.present || 0,
          "Late Days": s.late || 0,
          "Absent Days": s.absent || 0,
          "Remote Days": s.remote || 0,
          "Total Hours": Number(s.totalHours || 0).toFixed(1),
          "Total Late Minutes": s.totalLateMinutes || 0,
          "Attendance Rate (%)": `${Math.round(s.attendanceRate || 0)}%`,
          "Last Seen": s.lastSeen || "—",
        };
      })
    : [{
        "Employee ID": "—",
        "Employee Name": "No summary data found",
        Department: "—",
        Role: "—",
        "Present Days": 0,
        "Late Days": 0,
        "Absent Days": 0,
        "Remote Days": 0,
        "Total Hours": "0",
        "Total Late Minutes": 0,
        "Attendance Rate (%)": "0%",
        "Last Seen": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Scorecard");
  XLSX.writeFile(wb, `attendance_scorecard_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
