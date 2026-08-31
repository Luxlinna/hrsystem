import type { PayrollRun } from "../types";

export function exportPayrollRunsCSV(runs: PayrollRun[]): boolean {
  const headers = [
    "Period",
    "Department",
    "Employee Count",
    "Total Base",
    "Total Bonus",
    "Total Deductions",
    "Total Net",
    "Status",
    "Submitted By",
    "Submitted At",
    "Notes",
  ];

  const rows = runs.map((r) => [
    `"${r.period}"`,
    `"${r.department || "All Departments"}"`,
    r.employee_count || 0,
    Number(r.total_base || 0),
    Number(r.total_bonus || 0),
    Number(r.total_deductions || 0),
    Number(r.total_net || 0),
    `"${r.status}"`,
    `"${r.submitted_by || ""}"`,
    `"${r.submitted_at || ""}"`,
    `"${(r.notes || "").replace(/"/g, '""')}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `payroll_runs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
