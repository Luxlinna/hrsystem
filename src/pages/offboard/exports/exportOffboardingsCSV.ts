import type { Offboarding } from "../types";

export function exportOffboardingsCSV(offboardings: Offboarding[]): boolean {
  const headers = [
    "Employee Name",
    "Role",
    "Department",
    "Branch",
    "Last Working Day",
    "Departure Reason",
    "Status",
    "Completed Tasks",
    "Total Tasks",
    "Clearance Progress",
    "Created Date",
  ];

  const rows = offboardings.map((o) => {
    const empName = `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`.trim() || "Employee";
    const dept = o.employees?.department || "—";
    const branch = o.employees?.branches?.name || "Main Branch";
    const role = o.employees?.role || "Staff";
    const tasks = o.tasks || [];
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${branch.replace(/"/g, '""')}"`,
      `"${o.last_day || "—"}"`,
      `"${(o.reason || "Departure").replace(/"/g, '""')}"`,
      `"${(o.status || "initiated").toUpperCase()}"`,
      completedTasks,
      tasks.length,
      `"${progress}%"`,
      `"${o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `offboarding_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
