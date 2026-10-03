import type { Employee } from "../types";
import type { SelfBenefitEnrollment } from "./exportSelfBenefitsPDF";

export function exportSelfBenefitsCSV(
  enrollments: SelfBenefitEnrollment[],
  employee: Employee | null
): boolean {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
  const headers = ["Employee", "Plan Name", "Provider", "Type", "Coverage Amount", "Employee Contribution", "Status", "Enrolled Date"];

  const rows = enrollments.map((e) => [
    `"${empName.replace(/"/g, '""')}"`,
    `"${(e.benefit_plans?.name || "").replace(/"/g, '""')}"`,
    `"${(e.benefit_plans?.provider || "").replace(/"/g, '""')}"`,
    `"${e.benefit_plans?.type || ""}"`,
    e.benefit_plans?.coverage_amount || 0,
    e.benefit_plans?.employee_contribution || 0,
    `"${e.status || "enrolled"}"`,
    `"${e.created_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `my_benefits_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
