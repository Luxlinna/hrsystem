import type { EmployeeItemRecord } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportItemizedRecordsXLSX(records: EmployeeItemRecord[]): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r) => {
        const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Employee";
        const dept = r.employees?.department || "—";
        const role = r.employees?.role || "—";

        return {
          "Record ID": r.id,
          Employee: empName,
          Department: dept,
          Role: role,
          Month: r.month,
          "Base Salary ($)": Number(r.base_salary || 0),
          "Bonus ($)": Number(r.bonus || 0),
          "Deductions ($)": Number(r.deductions || 0),
          "Net Pay ($)": Number(r.net_pay || 0),
          Status: (r.status || "pending").toUpperCase(),
        };
      })
    : [{
        "Record ID": "—",
        Employee: "No itemized records found",
        Department: "—",
        Role: "—",
        Month: "—",
        "Base Salary ($)": 0,
        "Bonus ($)": 0,
        "Deductions ($)": 0,
        "Net Pay ($)": 0,
        Status: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ItemizedPayslips");
  XLSX.writeFile(wb, `itemized_payslips_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
