import type { EnrichedOffboardingTask } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportOffboardTasksXLSX(tasks: EnrichedOffboardingTask[]): Promise<boolean> {
  const data = tasks.length > 0
    ? tasks.map((t) => ({
        "Task ID": t.id,
        "Clearance Item": t.title,
        Department: t.type || "General",
        "Departing Employee": t.employeeName,
        Role: t.employeeRole,
        "Employee Dept": t.employeeDept,
        "Last Working Day": t.last_day || "—",
        Assignee: t.assignee || "Unassigned",
        "Due Date": t.due_date || "—",
        Status: (t.status || "pending").toUpperCase(),
        "Offboarding Status": (t.offboardingStatus || "in_progress").toUpperCase(),
      }))
    : [{
        "Task ID": "—",
        "Clearance Item": "No clearance tasks found",
        Department: "—",
        "Departing Employee": "—",
        Role: "—",
        "Employee Dept": "—",
        "Last Working Day": "—",
        Assignee: "—",
        "Due Date": "—",
        Status: "—",
        "Offboarding Status": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clearance Tasks");
  XLSX.writeFile(wb, `offboarding_clearance_tasks_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
