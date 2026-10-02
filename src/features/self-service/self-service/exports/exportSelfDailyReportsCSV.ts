import type { Employee, WorkLog } from "../types";

export function exportSelfDailyReportsCSV(
  logs: WorkLog[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Date", "Start Time", "End Time", "Activity", "Notes"];

  const rows = logs.map((l) => [
    `"${empName.replace(/"/g, '""')}"`,
    `"${l.log_date}"`,
    `"${l.start_time || ""}"`,
    `"${l.end_time || ""}"`,
    `"${l.activity.replace(/"/g, '""')}"`,
    `"${(l.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_daily_reports_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
