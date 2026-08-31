import type { Employee } from "../types";

export function exportOrgChartCSV(employees: Employee[], branchName?: string): boolean {
  const employeeMap = new Map<string, Employee>();
  employees.forEach((e) => employeeMap.set(e.id, e));

  const headers = [
    "Full Name",
    "Role",
    "Department",
    "Branch",
    "Reports To",
    "Direct Reports Count",
    "Email",
    "Phone",
  ];

  const rows = employees.map((e) => {
    const mgr = e.reports_to ? employeeMap.get(e.reports_to) : null;
    const mgrName = mgr ? `${mgr.first_name} ${mgr.last_name}` : "Executive (None)";
    const directReportsCount = employees.filter((x) => x.reports_to === e.id).length;

    return [
      `"${e.first_name} ${e.last_name}"`,
      `"${e.role.replace(/"/g, '""')}"`,
      `"${(e.department || "General").replace(/"/g, '""')}"`,
      `"${(e.branches?.name || branchName || "Main Branch").replace(/"/g, '""')}"`,
      `"${mgrName.replace(/"/g, '""')}"`,
      directReportsCount,
      `"${(e.email || "—").replace(/"/g, '""')}"`,
      `"${(e.phone || "—").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `org_chart_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
