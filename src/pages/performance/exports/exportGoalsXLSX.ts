import type { Goal, Employee } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportGoalsXLSX(goals: Goal[], employees: Employee[]): Promise<boolean> {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const data = goals.length > 0
    ? goals.map((g) => {
        const emp = employeeMap.get(g.employee_id);
        const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Team Member";
        const dept = emp?.department || "—";
        const role = emp?.role || "Staff";

        return {
          "Goal ID": g.id,
          "Goal Title": g.title,
          Description: g.description || "",
          "Assigned Employee": empName,
          Department: dept,
          Role: role,
          "Target Date": g.target_date || "—",
          "Progress (%)": `${g.progress || 0}%`,
          Status: (g.status || "in_progress").replace(/_/g, " ").toUpperCase(),
        };
      })
    : [{
        "Goal ID": "—",
        "Goal Title": "No goals found",
        Description: "—",
        "Assigned Employee": "—",
        Department: "—",
        Role: "—",
        "Target Date": "—",
        "Progress (%)": "0%",
        Status: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Goals & OKRs");
  XLSX.writeFile(wb, `performance_goals_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
