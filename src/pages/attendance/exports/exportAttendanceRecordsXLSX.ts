import type { AttendanceRecord } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportAttendanceRecordsXLSX(records: AttendanceRecord[]): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r) => {
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";
        const dept = r.employees?.department || "—";
        const location = r.work_location?.name || r.employees?.branches?.name || "Main Office";

        return {
          "Log ID": r.id,
          "Employee Name": empName,
          Department: dept,
          Location: location,
          Date: r.date,
          "Clock In": r.clock_in || "—",
          "Clock Out": r.clock_out || "—",
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
        "Clock In": "—",
        "Clock Out": "—",
        Status: "—",
        "Late (Minutes)": 0,
        "Early Leave (Minutes)": 0,
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");
  XLSX.writeFile(wb, `attendance_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
