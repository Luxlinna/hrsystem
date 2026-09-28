import type { AttendanceRecord } from "../types";
import type { ManagedShift } from "../components/shifts-manager/types";
import { mapRecordToExportRow } from "./attendanceExportRowData";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAttendanceRecordsXLSX(
  records: AttendanceRecord[],
  isFourPunchMode: boolean = false,
  shifts: ManagedShift[] = []
): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r, idx) => {
        const row = mapRecordToExportRow(r, idx, shifts);
        if (isFourPunchMode) {
          return {
            "No.": row.no,
            "Date": row.dateStr,
            "Day": row.dayOfWeek,
            "Employee Name": row.employeeName,
            "Biometric ID": row.biometricId,
            "Designation": row.designation,
            "Department": row.department,
            "Location": row.location,
            "Schedules": row.scheduleTitle,
            "Scheduled Hours": row.scheduledHours,
            "Morning In": row.clockIn,
            "Lunch Out": row.breakOut,
            "Lunch In": row.breakIn,
            "Evening Out": row.clockOut,
            "Clocked Hours": row.workedHours,
            "Status": row.status,
            "Salary": row.salary,
            "Notes": row.notes,
          };
        }

        return {
          "No.": row.no,
          "Date": row.dateStr,
          "Day": row.dayOfWeek,
          "Employee Name": row.employeeName,
          "Biometric ID": row.biometricId,
          "Designation": row.designation,
          "Department": row.department,
          "Location": row.location,
          "Schedules": row.scheduleTitle,
          "Scheduled Hours": row.scheduledHours,
          "Clock In": row.clockIn,
          "Clock Out": row.clockOut,
          "Clocked Hours": row.workedHours,
          "Status": row.status,
          "Salary": row.salary,
          "Notes": row.notes,
        };
      })
    : [
        {
          "No.": "—",
          "Date": "—",
          "Day": "—",
          "Employee Name": "No records found",
          "Biometric ID": "—",
          "Designation": "—",
          "Department": "—",
          "Location": "—",
          "Schedules": "—",
          "Scheduled Hours": "—",
          ...(isFourPunchMode
            ? { "Morning In": "—", "Lunch Out": "—", "Lunch In": "—", "Evening Out": "—" }
            : { "Clock In": "—", "Clock Out": "—" }),
          "Clocked Hours": "—",
          "Status": "—",
          "Salary": "—",
          "Notes": "—",
        },
      ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 13 },
    { wch: 8 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 15 },
    ...(isFourPunchMode
      ? [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
      : [{ wch: 12 }, { wch: 12 }]),
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = isFourPunchMode ? "4-Punch Attendance" : "Attendance Logs";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `attendance_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
