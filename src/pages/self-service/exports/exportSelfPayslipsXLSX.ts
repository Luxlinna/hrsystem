import type { Employee } from "../types";
import type { SelfPayslip } from "./exportSelfPayslipsPDF";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfPayslipsXLSX(
  payslips: SelfPayslip[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = payslips.length > 0
    ? payslips.map((p) => {
        const gross = Number(p.base_salary || 0) + Number(p.bonus || 0);
        return {
          Employee: empName,
          "Pay Period": p.month,
          "Base Salary ($)": Number(p.base_salary || 0),
          "Bonus ($)": Number(p.bonus || 0),
          "Gross Pay ($)": gross,
          "Deductions ($)": Number(p.deductions || 0),
          "Net Pay ($)": Number(p.net_pay || 0),
          Status: (p.status || "paid").toUpperCase(),
        };
      })
    : [{
        Employee: empName,
        "Pay Period": "No records",
        "Base Salary ($)": 0,
        "Bonus ($)": 0,
        "Gross Pay ($)": 0,
        "Deductions ($)": 0,
        "Net Pay ($)": 0,
        Status: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyPayslips");
  XLSX.writeFile(wb, `my_payslips_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
