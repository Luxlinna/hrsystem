import type { Review } from "../types";

export function exportReviewsCSV(reviews: Review[]): boolean {
  const headers = [
    "Employee Name",
    "Department",
    "Role",
    "Review Period",
    "Reviewer",
    "Overall Score",
    "Communication Score",
    "Teamwork Score",
    "Technical Score",
    "Leadership Score",
    "Status",
    "Submitted Date",
  ];

  const rows = reviews.map((r) => {
    const empName = `${r.employee?.first_name || ""} ${r.employee?.last_name || ""}`.trim() || "Employee";
    const dept = r.employee?.department || "—";
    const role = r.employee?.role || "Staff";
    const reviewerName = r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : "Manager";

    return [
      `"${empName.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${role.replace(/"/g, '""')}"`,
      `"${r.quarter} ${r.year}"`,
      `"${reviewerName.replace(/"/g, '""')}"`,
      r.overall_score !== null ? r.overall_score : "—",
      r.communication_score !== null ? r.communication_score : "—",
      r.teamwork_score !== null ? r.teamwork_score : "—",
      r.technical_score !== null ? r.technical_score : "—",
      r.leadership_score !== null ? r.leadership_score : "—",
      `"${(r.status || "draft").toUpperCase()}"`,
      `"${r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `performance_reviews_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
