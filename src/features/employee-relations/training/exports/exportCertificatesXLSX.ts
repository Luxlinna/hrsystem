import type { Enrollment } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportCertificatesXLSX(certificates: Enrollment[]): Promise<boolean> {
  const data = certificates.length > 0
    ? certificates.map((c) => {
        const empName = `${c.employees?.first_name || ""} ${c.employees?.last_name || ""}`.trim() || "Employee";
        const dept = c.employees?.department || "—";
        const courseTitle = c.training_courses?.title || "Training Module";

        return {
          "Certificate ID": c.id,
          "Certified Employee": empName,
          Department: dept,
          "Course / Curriculum": courseTitle,
          "Completion Date": c.completed_at ? new Date(c.completed_at).toLocaleDateString() : "—",
          "Score (%)": c.score !== null ? `${c.score}%` : "100%",
          Status: "CERTIFIED",
        };
      })
    : [{
        "Certificate ID": "—",
        "Certified Employee": "No certified employees found",
        Department: "—",
        "Course / Curriculum": "—",
        "Completion Date": "—",
        "Score (%)": "—",
        Status: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Certificates");
  XLSX.writeFile(wb, `training_certificates_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
