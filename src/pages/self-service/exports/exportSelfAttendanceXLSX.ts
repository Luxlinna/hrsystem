import type { Employee, AttendanceRecord } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfAttendanceXLSX(
  records: AttendanceRecord[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = records.length > 0
    ? records.map((r) => ({
        Employee: empName,
        Date: r.date ? new Date(r.date).toLocaleDateString() : "—",
        "Clock In": r.clock_in ? new Date(`2000-01-01T${r.clock_in}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—",
        "Clock Out": r.clock_out ? new Date(`2000-01-01T${r.clock_out}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—",
        "Hours Worked": r.hours_worked != null ? Number(r.hours_worked) : 0,
        "Late Minutes": r.late_minutes || 0,
        "Early Leave Minutes": r.early_leave_minutes || 0,
        Status: (r.status || "present").toUpperCase(),
        Notes: r.notes || "",
      }))
    : [{
        Employee: empName,
        Date: "No records",
        "Clock In": "—",
        "Clock Out": "—",
        "Hours Worked": 0,
        "Late Minutes": 0,
        "Early Leave Minutes": 0,
        Status: "—",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyAttendance");
  XLSX.writeFile(wb, `my_attendance_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
