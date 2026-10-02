import type { Employee, LeaveRequest } from "../types";

export function exportSelfLeaveCSV(
  leaves: LeaveRequest[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Leave Type", "Start Date", "End Date", "Days", "Reason", "Status", "Submitted Date"];

  const rows = leaves.map((l) => [
    `"${empName.replace(/"/g, '""')}"`,
    `"${l.leave_type}"`,
    `"${l.start_date}"`,
    `"${l.end_date}"`,
    l.days || 1,
    `"${(l.reason || "").replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${l.created_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_leave_requests_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
