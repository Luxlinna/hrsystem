import type { Enrollment } from "../types";

export function exportBenefitEnrollmentsCSV(enrollments: Enrollment[]): boolean {
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Benefit Plan",
    "Provider",
    "Status",
    "Enrolled Date",
  ];

  const rows = enrollments.map((e) => [
    `"${e.employees ? `${e.employees.first_name} ${e.employees.last_name}` : "—"}"`,
    `"${e.employees?.department || ""}"`,
    `"${e.employees?.role || ""}"`,
    `"${e.benefit_plans?.name || ""}"`,
    `"${e.benefit_plans?.provider || ""}"`,
    `"${e.status}"`,
    `"${e.created_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `benefit_enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
