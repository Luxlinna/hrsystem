import type { Employee } from "../types";
import type { SelfPayslip } from "./exportSelfPayslipsPDF";

export function exportSelfPayslipsCSV(
  payslips: SelfPayslip[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Pay Period", "Base Salary", "Bonus", "Gross Pay", "Deductions", "Net Pay", "Status"];

  const rows = payslips.map((p) => {
    const gross = Number(p.base_salary || 0) + Number(p.bonus || 0);
    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${p.month}"`,
      p.base_salary || 0,
      p.bonus || 0,
      gross,
      p.deductions || 0,
      p.net_pay || 0,
      `"${p.status}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_payslips_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
