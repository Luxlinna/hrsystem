import type { EmployeeSummaryItem } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAttendanceSummaryXLSX(summaries: EmployeeSummaryItem[]): Promise<boolean> {
  const data = summaries.length > 0
    ? summaries.map((s, idx) => {
        const empName = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Employee";
        const rawBio = s.biometric_user_id || s.employee_code;
        const bName = Array.isArray(s.branches) ? s.branches[0]?.name : (s.branches?.name || s.site || "");
        const bioId = formatBiometricId(rawBio, bName) || "—";

        const rawSalary = s.basic_salary ?? s.contract_rate ?? null;
        const currency = s.contract_rate_currency || "$";
        const numSalary = rawSalary !== null && rawSalary !== undefined && rawSalary !== "" ? Number(rawSalary) : null;
        const salary = numSalary !== null && !Number.isNaN(numSalary) ? `${currency} ${numSalary.toFixed(2)}` : `${currency} —`;

        return {
          "No.": idx + 1,
          "Employee Name": empName,
          "Biometric ID": bioId,
          Department: s.department || "—",
          Designation: s.role || "Staff",
          "Present Days": s.present || 0,
          "Late Days": s.late || 0,
          "Absent Days": s.absent || 0,
          "Remote Days": s.remote || 0,
          "Total Hours": Number(s.totalHours || 0).toFixed(1),
          "Total Late Minutes": s.totalLateMinutes || 0,
          "Attendance Rate": `${Math.round(s.attendanceRate || 0)}%`,
          Salary: salary,
          "Last Seen": s.lastSeen || "—",
        };
      })
    : [{
        "No.": "—",
        "Employee Name": "No summary data found",
        "Biometric ID": "—",
        Department: "—",
        Designation: "—",
        "Present Days": 0,
        "Late Days": 0,
        "Absent Days": 0,
        "Remote Days": 0,
        "Total Hours": "0",
        "Total Late Minutes": 0,
        "Attendance Rate": "0%",
        Salary: "—",
        "Last Seen": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 13 },
    { wch: 12 },
    { wch: 13 },
    { wch: 13 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Scorecard");
  XLSX.writeFile(wb, `attendance_scorecard_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
