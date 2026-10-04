import type { PayrollRecord } from "../types";

export function exportPayrollCSV(
  records: PayrollRecord[],
  periodMode: "month" | "all" = "month",
  selectedMonth = ""
): boolean {
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Month",
    "Base Salary",
    "Bonus",
    "Gross Pay",
    "Deductions",
    "Net Pay",
    "Status",
    "Notes",
  ];

  const rows = records.map((r) => {
    const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown";
    const dept = r.employees?.department || "";
    const role = r.employees?.role || "";
    const base = Number(r.base_salary || 0);
    const bonus = Number(r.bonus || 0);
    const deductions = Number(r.deductions || 0);
    const net = Number(r.net_pay || 0);
    const gross = base + bonus;

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${r.month}"`,
      base,
      bonus,
      gross,
      deductions,
      net,
      `"${r.status}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const fileName = `payroll_export_${periodMode === "month" && selectedMonth ? selectedMonth : "historical"}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
