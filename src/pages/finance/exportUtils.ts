import type { Expense } from "./types";
import { toYMD } from "./dateUtils";
import { toast } from "@/components/Toast";

export function exportExpensesCSV(filtered: Expense[]) {
  if (filtered.length === 0) {
    toast("Export", "No expenses found matching current filters", "warning");
    return;
  }

  const headers = ["Category", "Branch", "Amount", "Date", "Status", "Description", "Submitted By"];
  const rows = filtered.map((d) => [
    `"${d.category}"`,
    `"${d.branches?.name || "General"}"`,
    d.amount,
    d.date,
    d.status,
    `"${(d.description || "").replace(/"/g, '""')}"`,
    `"${d.submitted_by || ""}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `expenses_export_${toYMD(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${filtered.length} expense records to CSV`, "success");
}
