import type { Task } from "../types";
import { STATUS_CONFIG } from "../constants";

const getXLSX = async () => {
  return await import("xlsx");
};

export const exportTasksXLSX = async (tasks: Task[], filename = "tasks_report.xlsx") => {
  if (tasks.length === 0) return;
  const data = tasks.map((t) => ({
    Title: t.title,
    Description: t.description || "",
    Assignee: t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned",
    Department: t.employees?.department || "—",
    Priority: t.priority,
    Status: STATUS_CONFIG[t.status]?.label || t.status,
    "Due Date": t.due_date || "—",
    "Outside Work": t.is_outside_work ? "Yes" : "No",
    "Created Date": t.created_at.slice(0, 10),
  }));

  const headers = Object.keys(data[0]);
  const aoa = [headers, ...data.map((r) => headers.map((h) => r[h as keyof typeof r]))];
  const XLSX = await getXLSX();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");
  XLSX.writeFile(wb, filename);
};
