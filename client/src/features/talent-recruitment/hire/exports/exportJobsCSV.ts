import type { Job } from "../types";

export function exportJobsCSV(jobs: Job[]): boolean {
  const headers = ["Job Title", "Department", "Branch", "Employment Type", "Salary Min", "Salary Max", "Status", "Posted Date", "Closing Date"];
  const rows = jobs.map((j) => [
    `"${j.title.replace(/"/g, '""')}"`,
    `"${j.department.replace(/"/g, '""')}"`,
    `"${(j.branches?.name || j.location || "All Branches").replace(/"/g, '""')}"`,
    `"${j.type.replace(/"/g, '""')}"`,
    j.salary_min || 0,
    j.salary_max || 0,
    `"${(j.status || "draft").toUpperCase()}"`,
    `"${j.posted_at ? new Date(j.posted_at).toLocaleDateString() : "—"}"`,
    `"${j.closing_date ? new Date(j.closing_date).toLocaleDateString() : "—"}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `jobs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
