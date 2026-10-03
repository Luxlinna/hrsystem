import type { BenefitPlan, Enrollment } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportBenefitPlansXLSX(plans: BenefitPlan[], enrollments: Enrollment[]): Promise<boolean> {
  const data = plans.length > 0
    ? plans.map((p) => {
        const enr = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
        return {
          "Plan ID": p.id,
          "Plan Name": p.name,
          Provider: p.provider,
          Type: p.type.toUpperCase(),
          Status: (p.status || "active").toUpperCase(),
          "Coverage Amount ($)": Number(p.coverage_amount || 0),
          "Employee Contribution ($/mo)": Number(p.employee_contribution || 0),
          "Eligible Employees": p.eligible_count || 0,
          "Active Enrollees": enr,
          Description: p.description || "",
        };
      })
    : [{
        "Plan ID": "—",
        "Plan Name": "No benefit plans found",
        Provider: "—",
        Type: "—",
        Status: "—",
        "Coverage Amount ($)": 0,
        "Employee Contribution ($/mo)": 0,
        "Eligible Employees": 0,
        "Active Enrollees": 0,
        Description: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BenefitPlans");
  XLSX.writeFile(wb, `benefit_plans_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
