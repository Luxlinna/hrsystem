import type { AttendanceRecord } from "../types";
import { formatTime, calcHours } from "../constants";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAttendanceRecordsXLSX(
  records: AttendanceRecord[],
  isFourPunchMode: boolean = false
): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r) => {
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
        const dept = r.employees?.department || "—";
        const location = r.work_location?.name || r.employees?.branches?.name || "Main Office";
        const totalHours = r.hours_worked ? `${r.hours_worked}h` : calcHours(r.clock_in, r.clock_out);

        if (isFourPunchMode) {
          return {
            "Log ID": r.id,
            "Employee Name": empName,
            Department: dept,
            Location: location,
            Date: r.date,
            "Morning In": formatTime(r.clock_in),
            "Lunch Out": formatTime(r.break_out),
            "Lunch In": formatTime(r.break_in),
            "Evening Out": formatTime(r.clock_out),
            "Total Hours": totalHours,
            Status: (r.status || "present").toUpperCase(),
            "Late (Minutes)": r.late_minutes || 0,
            Notes: r.notes || "",
          };
        }

        return {
          "Log ID": r.id,
          "Employee Name": empName,
          Department: dept,
          Location: location,
          Date: r.date,
          "Check In": formatTime(r.clock_in),
          "Check Out": formatTime(r.clock_out),
          "Total Hours": totalHours,
          Status: (r.status || "present").toUpperCase(),
          "Late (Minutes)": r.late_minutes || 0,
          "Early Leave (Minutes)": r.early_leave_minutes || 0,
          Notes: r.notes || "",
        };
      })
    : [{
        "Log ID": "—",
        "Employee Name": "No records found",
        Department: "—",
        Location: "—",
        Date: "—",
        ...(isFourPunchMode
          ? {
              "Morning In": "—",
              "Lunch Out": "—",
              "Lunch In": "—",
              "Evening Out": "—",
            }
          : {
              "Check In": "—",
              "Check Out": "—",
            }),
        "Total Hours": "—",
        Status: "—",
        "Late (Minutes)": 0,
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  const sheetName = isFourPunchMode ? "4-Punch Timesheet" : "Attendance Logs";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `attendance_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
