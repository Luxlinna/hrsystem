import type { DisciplinaryRecord } from "./types";
import { toast } from "@/components/Toast";

export function exportDisciplinaryCSV(records: DisciplinaryRecord[]) {
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
  const rows = records.map((r) => [
    `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : ""}"`,
    `"${r.employees?.department || ""}"`,
    `"${r.employees?.role || ""}"`,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.type}"`,
    `"${r.severity}"`,
    `"${r.status}"`,
    `"${r.incident_date || ""}"`,
    `"${r.follow_up_date || ""}"`,
    `"${r.created_by || ""}"`,
    `"${(r.action_taken || "").replace(/"/g, '""')}"`,
    `"${r.resolved_at || ""}"`,
  ]);
  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `disciplinary_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${records.length} disciplinary records.`, "success");
}
