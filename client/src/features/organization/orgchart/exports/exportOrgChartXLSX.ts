import type { Employee } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportOrgChartXLSX(employees: Employee[], branchName?: string): Promise<boolean> {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const data = employees.length > 0
    ? employees.map((e) => {
        const mgr = e.reports_to ? employeeMap.get(e.reports_to) : null;
        const mgrName = mgr ? `${mgr.first_name} ${mgr.last_name}` : "Executive (None)";
        const directReportsCount = employees.filter((x) => x.reports_to === e.id).length;

        return {
          "Employee ID": e.id,
          "Full Name": `${e.first_name} ${e.last_name}`,
          Role: e.role,
          Department: e.department || "General",
          Branch: e.branches?.name || branchName || "Main Branch",
          "Reports To (Manager)": mgrName,
          "Direct Reports Count": directReportsCount,
          Email: e.email || "—",
          Phone: e.phone || "—",
        };
      })
    : [{
        "Employee ID": "—",
        "Full Name": "No employees found",
        Role: "—",
        Department: "—",
        Branch: "—",
        "Reports To (Manager)": "—",
        "Direct Reports Count": 0,
        Email: "—",
        Phone: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Org Hierarchy");
  XLSX.writeFile(wb, `organization_chart_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
