import type { Task } from "../types";
import { STATUS_CONFIG } from "../constants";

export const exportTasksCSV = (tasks: Task[], filename = "tasks_report.csv") => {
  if (tasks.length === 0) return;

  const escapeCSV = (val: unknown) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    "Task Title",
    "Description",
    "Assignee",
    "Department",
    "Priority",
    "Status",
    "Due Date",
    "Outside Work (GPS)",
    "Created Date",
  ];

  const rows = tasks.map((t) => [
    escapeCSV(t.title),
    escapeCSV(t.description || ""),
    escapeCSV(t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned"),
    escapeCSV(t.employees?.department || "—"),
    escapeCSV(t.priority.toUpperCase()),
    escapeCSV(STATUS_CONFIG[t.status]?.label || t.status),
    escapeCSV(t.due_date || "—"),
    escapeCSV(t.is_outside_work ? "Yes" : "No"),
    escapeCSV(t.created_at ? t.created_at.slice(0, 10) : "—"),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
