import type { ComplaintSuggestion } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

export async function exportComplaintXLSX(records: ComplaintSuggestion[]): Promise<void> {
  const XLSX = await import("xlsx");

  const data = records.map((r, i) => ({
    "No": i + 1,
    "Date": r.entry_date,
    "Category": COMPLAINT_TYPE_CONFIG[r.type]?.label ?? r.type,
    "Target To": r.target_to,
    "Employee": r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "General",
    "Subject": r.subject,
    "Details": r.details,
    "Suggestion": r.suggestion ?? "",
    "Status": COMPLAINT_STATUS_CONFIG[r.status]?.label ?? r.status,
    "Remark": r.remark ?? "",
    "Attachment": r.attachment_name ?? (r.attachment_url ? "Attached" : ""),
    "Recorded By": r.recorded_by ?? "",
    "Created At": r.created_at ? r.created_at.slice(0, 10) : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [6, 12, 14, 22, 20, 24, 35, 30, 16, 25, 20, 16, 12].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Complaints & Suggestions");
  XLSX.writeFile(wb, `complaints_suggestions_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
