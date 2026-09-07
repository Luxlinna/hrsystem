import type { Employee, AccountStatus } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportEmployeesXLSX(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {}
): Promise<boolean> {
  const data = employees.length > 0
    ? employees.map((e) => {
        const acc = accountStatus[e.email];
        const accountStatusValue = acc?.hasAccount ? "Active Account" : acc?.invited ? "Invited" : "No Account";

        return {
          "Employee ID": e.id,
          "First Name": e.first_name,
          "Last Name": e.last_name,
          Email: e.email,
          Phone: e.phone || "—",
          Role: e.role || "—",
          Department: e.department || "—",
          Branch: e.branches?.name || "Headquarters",
          Status: (e.status || "active").toUpperCase(),
          "Join Date": e.join_date || "—",
          "Account Status": accountStatusValue,
        };
      })
    : [{
        "Employee ID": "—",
        "First Name": "No employees found",
        "Last Name": "—",
        Email: "—",
        Phone: "—",
        Role: "—",
        Department: "—",
        Branch: "—",
        Status: "—",
        "Join Date": "—",
        "Account Status": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Directory");
  XLSX.writeFile(wb, `employees_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
