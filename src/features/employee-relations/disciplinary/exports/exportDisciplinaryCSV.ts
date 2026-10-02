import type { DisciplinaryRecord } from "../types";

export function exportDisciplinaryCSV(records: DisciplinaryRecord[]): boolean {
  const headers = [
    "Employee ID",
    "Employee",
    "Department",
    "Role",
    "Warning / Case Title",
    "Warning Type",
    "Severity",
    "Status",
    "Warning Date",
    "Follow Up Date",
    "Description of Warning",
    "Action to Take",
    "Employee Promise",
    "Remark",
    "Attachment URL",
    "Logged By",
    "Resolution Date",
  ];

  const rows = records.map((r) => {
    const empId = r.employees?.employee_id || r.employee_id?.substring(0, 8) || "";
    const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "";
    const dept = r.employees?.department || "";
    const role = r.employees?.role || "";

    return [
      `"${empId}"`,
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.warning_type || r.type}"`,
      `"${r.severity}"`,
      `"${r.status}"`,
      `"${r.warning_date || r.incident_date || ""}"`,
      `"${r.follow_up_date || ""}"`,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      `"${(r.action_to_take || r.action_taken || "").replace(/"/g, '""')}"`,
      `"${(r.employee_promise || "").replace(/"/g, '""')}"`,
      `"${(r.remark || r.notes || "").replace(/"/g, '""')}"`,
      `"${(r.document_url || "").replace(/"/g, '""')}"`,
      `"${r.created_by || ""}"`,
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
