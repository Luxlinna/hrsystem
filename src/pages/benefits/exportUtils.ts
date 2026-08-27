import type { BenefitPlan, Enrollment } from "./types";
import { toast } from "@/components/Toast";

export function exportPlansCSV(plans: BenefitPlan[], enrollments: Enrollment[]) {
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
      `"${p.name}"`,
      `"${p.provider}"`,
      `"${p.type}"`,
      `"${p.status}"`,
      p.coverage_amount || 0,
      p.employee_contribution || 0,
      p.eligible_count || 0,
      enr,
    ];
  });
  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `benefit_plans_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${plans.length} benefit plans.`, "success");
}

export function exportEnrollmentsCSV(enrollments: Enrollment[]) {
  const headers = [
    "Employee",
    "Department",
    "Role",
    "Benefit Plan",
    "Provider",
    "Status",
    "Enrolled Date",
  ];
  const rows = enrollments.map((e) => [
    `"${e.employees ? `${e.employees.first_name} ${e.employees.last_name}` : "—"}"`,
    `"${e.employees?.department || ""}"`,
    `"${e.employees?.role || ""}"`,
    `"${e.benefit_plans?.name || ""}"`,
    `"${e.benefit_plans?.provider || ""}"`,
    `"${e.status}"`,
    `"${e.created_at || ""}"`,
  ]);
  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `benefit_enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${enrollments.length} enrollments.`, "success");
}
