import type { LeaveRequest } from "./types";
import { LEAVE_TYPE_CONFIG } from "./constants";
import { formatDate } from "./dateUtils";

export function exportLeaveToCSV(filteredRequests: LeaveRequest[]): boolean {
  if (filteredRequests.length === 0) {
    return false;
  }
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
    "Submitted Date",
  ];
  const rows = filteredRequests.map((r) => [
    `"${(r.employees?.first_name || "") + " " + (r.employees?.last_name || "")}"`,
    `"${r.employees?.department || ""}"`,
    `"${r.employees?.role || ""}"`,
    `"${LEAVE_TYPE_CONFIG[r.leave_type]?.label || r.leave_type}"`,
    `"${r.start_date}"`,
    `"${r.end_date}"`,
    r.days,
    `"${r.status}"`,
    `"${(r.reason || "").replace(/"/g, '""')}"`,
    `"${formatDate(r.created_at?.slice(0, 10))}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Leave_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
