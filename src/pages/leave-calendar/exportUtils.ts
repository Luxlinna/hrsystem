import type { LeaveRequest } from "./types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "./constants";

export function exportCalendarCSV(
  filteredLeaves: LeaveRequest[],
  month: number,
  year: number
): void {
  const headers = [
    "Employee Name",
    "Department",
    "Role",
    "Leave Type",
    "Start Date",
    "End Date",
    "Days",
    "Status",
    "Reason",
  ];
  const rows = filteredLeaves.map((l) => [
    `"${l.employees?.first_name || ""} ${l.employees?.last_name || ""}"`,
    `"${l.employees?.department || ""}"`,
    `"${l.employees?.role || ""}"`,
    `"${LEAVE_TYPE_CONFIG[l.leave_type]?.label || l.leave_type}"`,
    l.start_date,
    l.end_date,
    l.days,
    l.status,
    `"${(l.reason || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `leave_schedule_${MONTHS[month].toLowerCase()}_${year}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
