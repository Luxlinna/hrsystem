import type { Employee, OutsideWorkTask } from "../types";

export function exportSelfWorkOutsideCSV(
  tasks: OutsideWorkTask[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Task Title", "Work Location", "Due Date", "Check-In At", "Check-Out At", "Status"];

  const rows = tasks.map((t) => [
    `"${empName.replace(/"/g, '""')}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.work_address || "").replace(/"/g, '""')}"`,
    `"${t.due_date || ""}"`,
    `"${t.work_checked_in_at || ""}"`,
    `"${t.work_checked_out_at || ""}"`,
    `"${t.work_status || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_outside_work_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
