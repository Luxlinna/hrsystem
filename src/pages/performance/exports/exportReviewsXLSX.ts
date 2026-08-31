import type { Review } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportReviewsXLSX(reviews: Review[]): Promise<boolean> {
  const data = reviews.length > 0
    ? reviews.map((r) => {
        const empName = `${r.employee?.first_name || ""} ${r.employee?.last_name || ""}`.trim() || "Employee";
        const dept = r.employee?.department || "—";
        const role = r.employee?.role || "Staff";
        const reviewerName = r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : "Manager";

        return {
          "Review ID": r.id,
          "Employee Name": empName,
          Department: dept,
          Role: role,
          "Review Period": `${r.quarter} ${r.year}`,
          Reviewer: reviewerName,
          "Overall Score": r.overall_score !== null ? r.overall_score : "—",
          "Communication Score": r.communication_score !== null ? r.communication_score : "—",
          "Teamwork Score": r.teamwork_score !== null ? r.teamwork_score : "—",
          "Technical Score": r.technical_score !== null ? r.technical_score : "—",
          "Leadership Score": r.leadership_score !== null ? r.leadership_score : "—",
          Status: (r.status || "draft").toUpperCase(),
          "Submitted Date": r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—",
          Strengths: r.strengths || "",
          "Areas for Improvement": r.areas_for_improvement || "",
          Comments: r.comments || "",
        };
      })
    : [{
        "Review ID": "—",
        "Employee Name": "No reviews found",
        Department: "—",
        Role: "—",
        "Review Period": "—",
        Reviewer: "—",
        "Overall Score": "—",
        "Communication Score": "—",
        "Teamwork Score": "—",
        "Technical Score": "—",
        "Leadership Score": "—",
        Status: "—",
        "Submitted Date": "—",
        Strengths: "—",
        "Areas for Improvement": "—",
        Comments: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Performance Reviews");
  XLSX.writeFile(wb, `performance_reviews_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
