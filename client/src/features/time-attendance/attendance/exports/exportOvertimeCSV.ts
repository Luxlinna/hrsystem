import { toast } from "@/components/Toast";
import type { OvertimeRecord } from "../types/overtimeTypes";

export function exportOvertimeCSV(records: OvertimeRecord[]) {
  if (!records || records.length === 0) {
    toast("Export", "No overtime records to export", "warning");
    return;
  }

  const headers = [
    "Employee",
    "Department",
    "Role",
    "Overtime Type",
    "From Date",
    "To Date",
    "Time In",
    "Time Out",
    "Break (Min)",
    "Overtime Hours",
    "Status",
    "Reason",
    "Remarks",
    "Attachment Link",
    "Date Submitted",
  ];

  const rows = records.map((r) => [
    `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
    `"${r.employees?.department || ""}"`,
    `"${r.employees?.role || ""}"`,
    `"${r.overtime_type}"`,
    r.from_date,
    r.to_date,
    r.time_in,
    r.time_out,
    r.break_minutes || 0,
    r.overtime_hours,
    r.status.toUpperCase(),
    `"${(r.reason || "").replace(/"/g, '""')}"`,
    `"${(r.remark || "").replace(/"/g, '""')}"`,
    `"${r.attachment_url || ""}"`,
    new Date(r.created_at).toLocaleDateString(),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `overtime_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast("Export Complete", `Exported ${records.length} overtime records to CSV`, "success");
}
