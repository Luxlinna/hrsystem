import type { DisciplinaryRecord } from "../types";

export function exportDisciplinaryCSV(records: DisciplinaryRecord[]): boolean {
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Case Title",
    "Type",
    "Severity",
    "Status",
    "Incident Date",
    "Follow Up Date",
    "Logged By",
    "Action Taken",
    "Resolution Date",
  ];

  const rows = records.map((r) => {
    const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "";
    const dept = r.employees?.department || "";
    const role = r.employees?.role || "";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.type}"`,
      `"${r.severity}"`,
      `"${r.status}"`,
      `"${r.incident_date || ""}"`,
      `"${r.follow_up_date || ""}"`,
      `"${r.created_by || ""}"`,
      `"${(r.action_taken || "").replace(/"/g, '""')}"`,
      `"${r.resolved_at || ""}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `disciplinary_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
