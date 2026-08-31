import type { Expense } from "../types";

export function exportExpensesCSV(expenses: Expense[]): boolean {
  const headers = ["Category", "Branch", "Amount", "Date", "Status", "Description", "Submitted By"];
  const rows = expenses.map((d) => [
    `"${d.category}"`,
    `"${d.branches?.name || "General"}"`,
    d.amount,
    d.date,
    d.status,
    `"${(d.description || "").replace(/"/g, '""')}"`,
    `"${d.submitted_by || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
