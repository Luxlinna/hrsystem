import type { ComplaintSuggestion } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export function exportComplaintCSV(records: ComplaintSuggestion[]): void {
  const headers = [
    "No",
    "Date",
    "Category",
    "Target To",
    "Employee",
    "Subject",
    "Details",
    "Suggestion",
    "Status",
    "Remark",
    "Attachment",
    "Recorded By",
    "Created At",
  ];

  const rows = records.map((r, i) => [
    i + 1,
    r.entry_date,
    COMPLAINT_TYPE_CONFIG[r.type]?.label ?? r.type,
    r.target_to,
    r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "General",
    r.subject,
    r.details,
    r.suggestion ?? "",
    COMPLAINT_STATUS_CONFIG[r.status]?.label ?? r.status,
    r.remark ?? "",
    r.attachment_url ?? "",
    r.recorded_by ?? "",
    r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
  ]);

  const csvContent =
    "\uFEFF" +
    [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `complaints_suggestions_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
