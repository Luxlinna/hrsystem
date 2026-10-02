import type { PayrollRecord } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportPayrollXLSX(
  records: PayrollRecord[],
  periodMode: "month" | "all" = "month",
  selectedMonth = ""
): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r) => {
        const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown Employee";
        const dept = r.employees?.department || "—";
        const role = r.employees?.role || "—";
        const base = Number(r.base_salary || 0);
        const bonus = Number(r.bonus || 0);
        const deductions = Number(r.deductions || 0);
        const net = Number(r.net_pay || 0);
        const gross = base + bonus;

        return {
          "Payroll ID": r.id,
          Employee: empName,
          Department: dept,
          Role: role,
          "Pay Period": r.month,
          "Base Salary ($)": base,
          "Bonus / Allowances ($)": bonus,
          "Gross Pay ($)": gross,
          "Deductions / Taxes ($)": deductions,
          "Net Take-Home Pay ($)": net,
          Status: (r.status || "pending").toUpperCase(),
          Notes: r.notes || "",
        };
      })
    : [{
        "Payroll ID": "—",
        Employee: "No payroll records found",
        Department: "—",
        Role: "—",
        "Pay Period": "—",
        "Base Salary ($)": 0,
        "Bonus / Allowances ($)": 0,
        "Gross Pay ($)": 0,
        "Deductions / Taxes ($)": 0,
        "Net Take-Home Pay ($)": 0,
        Status: "—",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payroll");
  const fileName = `payroll_report_${periodMode === "month" && selectedMonth ? selectedMonth : "historical"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return true;
}
