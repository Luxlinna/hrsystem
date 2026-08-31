import type { Course } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportCoursesXLSX(courses: Course[]): Promise<boolean> {
  const data = courses.length > 0
    ? courses.map((c) => ({
        "Course ID": c.id,
        "Course Title": c.title,
        Category: c.category,
        "Branch Scope": c.branch_id ? c.branches?.name || "Branch Specific" : "Company-Wide (Admin)",
        Instructor: c.instructor || "Internal",
        Format: c.format.replace(/_/g, " ").toUpperCase(),
        "Duration (Hours)": c.duration_hours || 0,
        Status: (c.status || "active").toUpperCase(),
        "Created Date": c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
        Description: c.description || "",
      }))
    : [{
        "Course ID": "—",
        "Course Title": "No courses found",
        Category: "—",
        "Branch Scope": "—",
        Instructor: "—",
        Format: "—",
        "Duration (Hours)": 0,
        Status: "—",
        "Created Date": "—",
        Description: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Courses");
  XLSX.writeFile(wb, `training_courses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
