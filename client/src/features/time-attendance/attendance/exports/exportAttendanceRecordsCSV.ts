import type { AttendanceRecord } from "../types";
import type { ManagedShift } from "../components/shifts-manager/types";
import { mapRecordToExportRow } from "./attendanceExportRowData";

function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportAttendanceRecordsCSV(
  records: AttendanceRecord[],
  isFourPunchMode: boolean = false,
  shifts: ManagedShift[] = []
): boolean {
  const headers = isFourPunchMode
    ? [
        "No.",
        "Date",
        "Day",
        "Employee Name",
        "Biometric ID",
        "Position",
        "Division",
        "Department",
        "Location",
        "Schedule Shift",
        "Scheduled Windows",
        "Scheduled Hours",
        "Morning In",
        "Lunch Out",
        "Lunch In",
        "Evening Out",
        "Clocked Hours",
        "Status",
        "Notes",
      ]
    : [
        "No.",
        "Date",
        "Day",
        "Employee Name",
        "Biometric ID",
        "Position",
        "Division",
        "Department",
        "Location",
        "Schedule Shift",
        "Scheduled Windows",
        "Scheduled Hours",
        "Clock In",
        "Clock Out",
        "Clocked Hours",
        "Status",
        "Notes",
      ];

  const rows = records.map((r, idx) => {
    const row = mapRecordToExportRow(r, idx, shifts);
    if (isFourPunchMode) {
      return [
        row.no,
        escapeCSV(row.dateStr),
        escapeCSV(row.dayOfWeek),
        escapeCSV(row.employeeName),
        escapeCSV(row.biometricId),
        escapeCSV(row.position),
        escapeCSV(row.division),
        escapeCSV(row.department),
        escapeCSV(row.location),
        escapeCSV(row.scheduleTitle),
        escapeCSV(row.scheduleWindows),
        escapeCSV(row.scheduledHours),
        escapeCSV(row.clockIn),
        escapeCSV(row.breakOut),
        escapeCSV(row.breakIn),
        escapeCSV(row.clockOut),
        escapeCSV(row.workedHours),
        escapeCSV(row.status),
        escapeCSV(row.notes),
      ].join(",");
    }

    return [
      row.no,
      escapeCSV(row.dateStr),
      escapeCSV(row.dayOfWeek),
      escapeCSV(row.employeeName),
      escapeCSV(row.biometricId),
      escapeCSV(row.position),
      escapeCSV(row.division),
      escapeCSV(row.department),
      escapeCSV(row.location),
      escapeCSV(row.scheduleTitle),
      escapeCSV(row.scheduleWindows),
      escapeCSV(row.scheduledHours),
      escapeCSV(row.clockIn),
      escapeCSV(row.clockOut),
      escapeCSV(row.workedHours),
      escapeCSV(row.status),
      escapeCSV(row.notes),
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `attendance_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
