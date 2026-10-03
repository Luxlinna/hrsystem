import type { Goal, Employee } from "../types";

export function exportGoalsCSV(goals: Goal[], employees: Employee[]): boolean {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const headers = [
    "Goal Title",
    "Description",
    "Assigned Employee",
    "Department",
    "Target Date",
    "Progress",
    "Status",
  ];

  const rows = goals.map((g) => {
    const emp = employeeMap.get(g.employee_id);
    const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Team Member";
    const dept = emp?.department || "—";

    return [
      `"${g.title.replace(/"/g, '""')}"`,
      `"${(g.description || "").replace(/"/g, '""')}"`,
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${g.target_date || "—"}"`,
      `"${g.progress || 0}%"`,
      `"${(g.status || "in_progress").toUpperCase()}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `performance_goals_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
