import type { EmployeeExit } from "../types";
import { EXIT_TYPE_CONFIG, REASON_TYPE_CONFIG } from "../constants";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportExitCSV(exits: EmployeeExit[]): void {
  const headers = [
    "No", "Employee Name", "Department", "Role",
    "Exit Type", "Last Working Day", "Reason Type",
    "Reason Description", "Document", "Recorded By", "Created At",
  ];

  const rows = exits.map((ex, i) => [
    i + 1,
    `${ex.employees?.first_name ?? ""} ${ex.employees?.last_name ?? ""}`.trim(),
    ex.employees?.department ?? "",
    ex.employees?.role ?? "",
    EXIT_TYPE_CONFIG[ex.exit_type]?.label ?? ex.exit_type,
    ex.last_working_day,
    REASON_TYPE_CONFIG[ex.reason_type]?.label ?? ex.reason_type,
    ex.reason_description ?? "",
    ex.document_name ?? "",
    ex.recorded_by ?? "",
    ex.created_at.slice(0, 10),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `exit_records_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
