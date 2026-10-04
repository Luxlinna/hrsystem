import type { Employee, OutsideWorkTask } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfWorkOutsideXLSX(
  tasks: OutsideWorkTask[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = tasks.length > 0
    ? tasks.map((t) => ({
        Employee: empName,
        "Task Title": t.title,
        "Work Location": t.work_address || "Client Site",
        "Due Date": t.due_date ? new Date(t.due_date).toLocaleDateString() : "—",
        "Check-In At": t.work_checked_in_at ? new Date(t.work_checked_in_at).toLocaleString() : "—",
        "Check-Out At": t.work_checked_out_at ? new Date(t.work_checked_out_at).toLocaleString() : "—",
        Status: (t.work_status || "pending").toUpperCase(),
      }))
    : [{
        Employee: empName,
        "Task Title": "No fieldwork records",
        "Work Location": "—",
        "Due Date": "—",
        "Check-In At": "—",
        "Check-Out At": "—",
        Status: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyWorkOutside");
  XLSX.writeFile(wb, `my_outside_work_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
