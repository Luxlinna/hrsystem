import type { Course } from "../types";

export function exportCoursesCSV(courses: Course[]): boolean {
  const headers = [
    "Course Title",
    "Category",
    "Branch Scope",
    "Instructor",
    "Format",
    "Duration (Hours)",
    "Status",
    "Created Date",
  ];

  const rows = courses.map((c) => {
    return [
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category.replace(/"/g, '""')}"`,
      `"${(c.branch_id ? c.branches?.name || "Branch Specific" : "Company-Wide").replace(/"/g, '""')}"`,
      `"${(c.instructor || "Internal").replace(/"/g, '""')}"`,
      `"${c.format.replace(/_/g, " ").toUpperCase()}"`,
      c.duration_hours || 0,
      `"${(c.status || "active").toUpperCase()}"`,
      `"${c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `training_courses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
