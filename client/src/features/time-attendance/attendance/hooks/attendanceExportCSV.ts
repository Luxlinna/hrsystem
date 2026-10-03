import { toast } from "@/components/Toast";
import { calcHours } from "../constants";
import type { AttendanceRecord } from "../types";
import type { DateBounds } from "./attendanceDateRangeUtils";

export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  dateBounds: DateBounds | null
) {
  if (records.length === 0) {
    toast("Export", "No records to export with current filters", "warning");
    return;
  }
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Work Site",
    "Date",
    "Check In",
    "Check Out",
    "Hours",
    "Status",
    "Late (Min)",
    "Notes",
  ];
  const rows = records.map((r) => [
    `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
    `"${r.employees?.department || ""}"`,
    `"${r.employees?.role || ""}"`,
    `"${r.work_location?.name || ""}"`,
    r.date,
    r.clock_in || "",
    r.clock_out || "",
    calcHours(r.clock_in, r.clock_out),
    r.status,
    r.late_minutes || 0,
    `"${(r.notes || "").replace(/"/g, '""')}"`,
  ]);
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute(
    "download",
    `attendance_export_${dateBounds?.start || "all"}_to_${dateBounds?.end || "all"}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${records.length} records to CSV`, "success");
}
