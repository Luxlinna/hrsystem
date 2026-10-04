import type { EmployeeItemRecord } from "../types";

export function exportItemizedRecordsCSV(records: EmployeeItemRecord[]): boolean {
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Month",
    "Base Salary",
    "Bonus",
    "Deductions",
    "Net Pay",
    "Status",
  ];

  const rows = records.map((r) => {
    const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown";
    const dept = r.employees?.department || "";
    const role = r.employees?.role || "";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${r.month}"`,
      Number(r.base_salary || 0),
      Number(r.bonus || 0),
      Number(r.deductions || 0),
      Number(r.net_pay || 0),
      `"${r.status}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `itemized_payslips_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
