import type { PayrollRun } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportPayrollRunsXLSX(runs: PayrollRun[]): Promise<boolean> {
  const data = runs.length > 0
    ? runs.map((r) => ({
        "Run ID": r.id,
        Period: r.period,
        Department: r.department || "All Departments",
        "Employee Count": r.employee_count || 0,
        "Total Base ($)": Number(r.total_base || 0),
        "Total Bonus ($)": Number(r.total_bonus || 0),
        "Total Deductions ($)": Number(r.total_deductions || 0),
        "Total Net ($)": Number(r.total_net || 0),
        Status: (r.status || "pending").toUpperCase(),
        "Submitted By": r.submitted_by || "—",
        "Submitted At": r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—",
        Notes: r.notes || "",
      }))
    : [{
        "Run ID": "—",
        Period: "—",
        Department: "No runs found",
        "Employee Count": 0,
        "Total Base ($)": 0,
        "Total Bonus ($)": 0,
        "Total Deductions ($)": 0,
        "Total Net ($)": 0,
        Status: "—",
        "Submitted By": "—",
        "Submitted At": "—",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PayrollRuns");
  XLSX.writeFile(wb, `payroll_runs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
