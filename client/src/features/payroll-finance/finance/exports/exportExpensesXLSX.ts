import type { Expense } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportExpensesXLSX(expenses: Expense[]): Promise<boolean> {
  const data = expenses.length > 0
    ? expenses.map((e) => ({
        "Expense ID": e.id,
        Category: e.category,
        Branch: e.branches?.name || "General",
        Date: e.date,
        "Amount ($)": Number(e.amount || 0),
        Status: (e.status || "pending").toUpperCase(),
        Description: e.description || "",
        "Submitted By": e.submitted_by || "",
      }))
    : [{
        "Expense ID": "—",
        Category: "No expenses found",
        Branch: "—",
        Date: "—",
        "Amount ($)": 0,
        Status: "—",
        Description: "—",
        "Submitted By": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(wb, `expenses_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
