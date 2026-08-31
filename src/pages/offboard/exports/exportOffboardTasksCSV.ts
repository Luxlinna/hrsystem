import type { EnrichedOffboardingTask } from "../types";

export function exportOffboardTasksCSV(tasks: EnrichedOffboardingTask[]): boolean {
  const headers = [
    "Clearance Item",
    "Department",
    "Departing Employee",
    "Role",
    "Employee Dept",
    "Assignee",
    "Due Date",
    "Status",
    "Last Working Day",
  ];

  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.type || "General").replace(/"/g, '""')}"`,
    `"${t.employeeName.replace(/"/g, '""')}"`,
    `"${t.employeeRole.replace(/"/g, '""')}"`,
    `"${t.employeeDept.replace(/"/g, '""')}"`,
    `"${(t.assignee || "Unassigned").replace(/"/g, '""')}"`,
    `"${t.due_date || "—"}"`,
    `"${(t.status || "pending").toUpperCase()}"`,
    `"${t.last_day || "—"}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `offboarding_clearance_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
