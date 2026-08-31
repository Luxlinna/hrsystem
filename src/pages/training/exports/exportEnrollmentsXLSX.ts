import type { Enrollment } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportEnrollmentsXLSX(enrollments: Enrollment[]): Promise<boolean> {
  const data = enrollments.length > 0
    ? enrollments.map((e) => {
        const empName = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.trim() || "Employee";
        const dept = e.employees?.department || "—";
        const courseTitle = e.training_courses?.title || "Training Module";

        return {
          "Enrollment ID": e.id,
          Learner: empName,
          Department: dept,
          "Course Title": courseTitle,
          Status: (e.status || "enrolled").toUpperCase(),
          "Progress (%)": `${e.progress || 0}%`,
          Score: e.score !== null ? e.score : "—",
          "Due Date": e.due_date ? new Date(e.due_date).toLocaleDateString() : "—",
          "Enrolled Date": e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : "—",
          "Completed Date": e.completed_at ? new Date(e.completed_at).toLocaleDateString() : "—",
          "Certificate Issued": e.certificate_issued ? "YES" : "NO",
          Notes: e.notes || "",
        };
      })
    : [{
        "Enrollment ID": "—",
        Learner: "No enrollments found",
        Department: "—",
        "Course Title": "—",
        Status: "—",
        "Progress (%)": "0%",
        Score: "—",
        "Due Date": "—",
        "Enrolled Date": "—",
        "Completed Date": "—",
        "Certificate Issued": "NO",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Enrollments");
  XLSX.writeFile(wb, `training_enrollments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
