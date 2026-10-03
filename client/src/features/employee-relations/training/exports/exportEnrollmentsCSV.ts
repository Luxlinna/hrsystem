import type { Enrollment } from "../types";

export function exportEnrollmentsCSV(enrollments: Enrollment[]): boolean {
  const headers = [
    "Learner",
    "Department",
    "Course Title",
    "Status",
    "Progress",
    "Score",
    "Due Date",
    "Enrolled Date",
    "Completed Date",
    "Certificate Issued",
  ];

  const rows = enrollments.map((e) => {
    const empName = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.trim() || "Employee";
    const dept = e.employees?.department || "—";
    const courseTitle = e.training_courses?.title || "Training Module";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${courseTitle.replace(/"/g, '""')}"`,
      `"${(e.status || "enrolled").toUpperCase()}"`,
      `"${e.progress || 0}%"`,
      e.score !== null ? e.score : "—",
      `"${e.due_date ? new Date(e.due_date).toLocaleDateString() : "—"}"`,
      `"${e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—"}"`,
      `"${e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—"}"`,
      `"${e.certificate_issued ? "YES" : "NO"}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `training_enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
