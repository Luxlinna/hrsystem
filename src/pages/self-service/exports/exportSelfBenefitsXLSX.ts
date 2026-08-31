import type { Employee } from "../types";
import type { SelfBenefitEnrollment } from "./exportSelfBenefitsPDF";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfBenefitsXLSX(
  enrollments: SelfBenefitEnrollment[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = enrollments.length > 0
    ? enrollments.map((e) => ({
        Employee: empName,
        "Plan Name": e.benefit_plans?.name || "General Benefit",
        Provider: e.benefit_plans?.provider || "—",
        Type: (e.benefit_plans?.type || "perk").toUpperCase(),
        "Coverage Amount ($)": Number(e.benefit_plans?.coverage_amount || 0),
        "Employee Contribution ($/mo)": Number(e.benefit_plans?.employee_contribution || 0),
        Status: (e.status || "enrolled").toUpperCase(),
        "Enrolled Date": e.created_at ? new Date(e.created_at).toLocaleDateString() : "—",
      }))
    : [{
        Employee: empName,
        "Plan Name": "No enrolled benefits",
        Provider: "—",
        Type: "—",
        "Coverage Amount ($)": 0,
        "Employee Contribution ($/mo)": 0,
        Status: "—",
        "Enrolled Date": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyBenefits");
  XLSX.writeFile(wb, `my_benefits_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
