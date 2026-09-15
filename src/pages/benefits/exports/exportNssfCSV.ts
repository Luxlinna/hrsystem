import type { NssfEmployee } from "../types";

function csvEscape(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportNssfCSV(employees: NssfEmployee[]): void {
  const headers = [
    "No",
    "Employee ID",
    "NSSF Number",
    "Name (English)",
    "Name (Khmer)",
    "Gender",
    "Nationality",
    "Date of Birth",
    "Join Date",
    "Basic Salary (USD)",
    "Status",
    "Department",
    "Branch",
  ];

  const rows = employees.map((e, idx) => [
    idx + 1,
    e.id,
    e.nssf_number || "",
    `${e.first_name} ${e.last_name}`,
    e.kh_name || "",
    e.gender || "",
    e.nationality || "Cambodian",
    e.date_of_birth || "",
    e.join_date || "",
    e.basic_salary ?? "",
    e.status || "Active",
    e.department || "",
    e.branch || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nssf_report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
