import type { BenefitPlan, Enrollment } from "../types";

export function exportBenefitPlansCSV(plans: BenefitPlan[], enrollments: Enrollment[]): boolean {
  const headers = [
    "Plan Name",
    "Provider",
    "Type",
    "Status",
    "Coverage Amount",
    "Employee Contribution",
    "Eligible Count",
    "Enrolled Count",
  ];

  const rows = plans.map((p) => {
    const enr = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.provider.replace(/"/g, '""')}"`,
      `"${p.type}"`,
      `"${p.status}"`,
      p.coverage_amount || 0,
      p.employee_contribution || 0,
      p.eligible_count || 0,
      enr,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `benefit_plans_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
