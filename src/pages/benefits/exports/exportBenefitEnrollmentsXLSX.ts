import type { Enrollment } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportBenefitEnrollmentsXLSX(enrollments: Enrollment[]): Promise<boolean> {
  const data = enrollments.length > 0
    ? enrollments.map((e) => {
        const empName = e.employees ? `${e.employees.first_name} ${e.employees.last_name}` : "—";
        const dept = e.employees?.department || "—";
        const role = e.employees?.role || "—";
        const planName = e.benefit_plans?.name || "—";
        const provider = e.benefit_plans?.provider || "—";

        return {
          "Enrollment ID": e.id,
          Employee: empName,
          Department: dept,
          Role: role,
          "Benefit Plan": planName,
          Provider: provider,
          Status: (e.status || "enrolled").toUpperCase(),
          "Enrolled Date": e.created_at ? new Date(e.created_at).toLocaleDateString() : "—",
        };
      })
    : [{
        "Enrollment ID": "—",
        Employee: "No enrollments found",
        Department: "—",
        Role: "—",
        "Benefit Plan": "—",
        Provider: "—",
        Status: "—",
        "Enrolled Date": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BenefitEnrollments");
  XLSX.writeFile(wb, `benefit_enrollments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
