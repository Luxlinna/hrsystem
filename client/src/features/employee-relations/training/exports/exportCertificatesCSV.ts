import type { Enrollment } from "../types";

export function exportCertificatesCSV(certificates: Enrollment[]): boolean {
  const headers = [
    "Certified Employee",
    "Department",
    "Course Title",
    "Completion Date",
    "Score",
    "Status",
  ];

  const rows = certificates.map((c) => {
    const empName = `${c.employees?.first_name || ""} ${c.employees?.last_name || ""}`.trim() || "Employee";
    const dept = c.employees?.department || "—";
    const courseTitle = c.training_courses?.title || "Training Module";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${courseTitle.replace(/"/g, '""')}"`,
      `"${c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "—"}"`,
      `"${c.score !== null ? `${c.score}%` : "100%"}"`,
      `"CERTIFIED"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `training_certificates_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
