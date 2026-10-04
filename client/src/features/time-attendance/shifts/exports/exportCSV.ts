import type { Shift, ShiftAssignment } from "../types";
import { formatDate, calculateHours } from "../utils";

export function exportShiftsCSV(
  filteredShifts: Shift[],
  assignments: ShiftAssignment[],
  currentDate: Date
): boolean {
  if (filteredShifts.length === 0) return false;

  const headers = [
    "Shift Date",
    "Shift Name",
    "Start Time",
    "End Time",
    "Duration (Hours)",
    "Department",
    "Branch",
    "Capacity",
    "Assigned Count",
    "Assigned Employees",
    "Notes",
  ];

  const rows = filteredShifts.map((s) => {
    const shiftStaff = assignments
      .filter((a) => a.shift_id === s.id)
      .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
      .join("; ");
    const hours = calculateHours(s.start_time, s.end_time);

    return [
      `"${s.shift_date}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.start_time}"`,
      `"${s.end_time}"`,
      hours,
      `"${(s.department || "").replace(/"/g, '""')}"`,
      `"${(s.branches?.name || "").replace(/"/g, '""')}"`,
      s.capacity,
      s.assignmentCount || 0,
      `"${shiftStaff.replace(/"/g, '""')}"`,
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shift_schedule_${formatDate(currentDate)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
