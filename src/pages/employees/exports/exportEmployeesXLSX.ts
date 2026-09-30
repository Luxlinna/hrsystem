import type { Employee, AccountStatus } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportEmployeesXLSX(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {}
): Promise<boolean> {
  const data = employees.length > 0
    ? employees.map((e, index) => {
        const acc = accountStatus[e.email];
        const accountStatusValue = acc?.hasAccount ? "Active Account" : acc?.invited ? "Invited" : "No Account";
        const fullName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "—";
        const salary = e.basic_salary != null ? `${e.basic_salary} USD` : e.contract_rate != null ? `${e.contract_rate} USD` : "—";
        const contractEnd = e.contract_end_date ? e.contract_end_date : "Never";

        return {
          "No.": index + 1,
          "Employee ID": e.employee_code || e.id.slice(0, 8),
          "Employee Name": fullName,
          "Khmer Name": e.kh_name || "—",
          "Position / Role": e.position || e.role || "—",
          "Employee Level": e.employee_level || "—",
          "Employment Type": e.employment_type || "—",
          Department: e.department || "—",
          "Branch / BU": e.branches?.name || e.code_bu || "Headquarters",
          "Work Location": e.work_locations?.name || e.working_location || "Main Office",
          "Joining Date": e.join_date || e.start_date || "—",
          "Contract Type": e.contract_type || "—",
          "Contract End Date": contractEnd,
          "Basic Salary / Rate": salary,
          "Salary Frequency": e.tax_salary_frequency || "Monthly",
          Status: (e.status || "active").replace(/_/g, " ").toUpperCase(),
          Email: e.email || "—",
          Phone: e.phone || "—",
          "Account Status": accountStatusValue,
        };
      })
    : [
        {
          "No.": 1,
          "Employee ID": "—",
          "Employee Name": "No employees found",
          "Khmer Name": "—",
          "Position / Role": "—",
          "Employee Level": "—",
          "Employment Type": "—",
          Department: "—",
          "Branch / BU": "—",
          "Work Location": "—",
          "Joining Date": "—",
          "Contract Type": "—",
          "Contract End Date": "—",
          "Basic Salary / Rate": "—",
          "Salary Frequency": "—",
          Status: "—",
          Email: "—",
          Phone: "—",
          "Account Status": "—",
        },
      ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Directory");
  XLSX.writeFile(wb, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
