import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/pages/movements/types";

export function formatDMY(dateStr?: string | null): string {
  if (!dateStr || dateStr.toLowerCase() === "never") return "Never";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatContractType(m: EmployeeMovement, emp: Employee): string {
  const cType = m.new_values?.contract_type || emp.contract_type || "PERMANENT (UDC)";
  const startDate =
    m.new_values?.contract_start_date ||
    emp.contract_effective_date ||
    emp.start_date ||
    emp.join_date;
  const endDate =
    m.new_values?.contract_end_date ||
    emp.contract_end_date ||
    emp.fdc_end_date;

  if (!startDate && !endDate) return cType;
  const startFormatted = startDate ? formatDMY(startDate) : "—";
  const endFormatted = endDate ? formatDMY(endDate) : "Never";

  return `${cType} : ${startFormatted} - ${endFormatted}`;
}

export function formatMovementTitle(m: EmployeeMovement): string {
  if (m.title) return m.title;
  switch (m.movement_type) {
    case "transfer":
      return "Transfer";
    case "salary_adjustment":
      return "Salary Adjustment";
    case "promote":
      return "Promotion";
    case "demote":
      return "Demote";
    case "pass_probation":
      return "Pass Probation";
    case "probation":
      return "Probation";
    case "change_contract":
      return "Change Contract";
    default:
      return m.movement_type
        ? String(m.movement_type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Movement";
  }
}

export function resolveMovementDisplayValues(m: EmployeeMovement, emp: Employee) {
  const newV = m.new_values || {};
  const site =
    newV.site ||
    newV.target_branch_name ||
    m.employees?.work_locations?.name ||
    m.employees?.branches?.name ||
    emp.site ||
    emp.code_bu ||
    (Array.isArray(emp.branches) ? emp.branches[0]?.name : emp.branches?.name) ||
    "—";
  const department =
    newV.department ||
    newV.target_department ||
    m.employees?.department ||
    emp.department ||
    "—";
  const designation =
    newV.role ||
    newV.new_role ||
    newV.position ||
    m.employees?.role ||
    emp.position ||
    emp.role ||
    "—";
  const contractTypeStr = formatContractType(m, emp);
  const employeeType = newV.employment_type || emp.employment_type || "—";
  const supervisor = newV.supervisor || newV.target_reports_to || emp.line_manager || "—";

  const rawSalary = newV.new_salary ?? newV.salary ?? emp.basic_salary ?? emp.contract_rate ?? null;
  const salaryFreq = newV.contract_rate_frequency || emp.contract_rate_frequency || "Monthly";

  const rawSalaryAfter =
    newV.salary_after_contract ?? emp.contract_rate_after ?? rawSalary ?? null;
  const salaryAfterFreq =
    newV.contract_rate_after_frequency || emp.contract_rate_after_frequency || "Monthly";

  return {
    site,
    department,
    designation,
    contractTypeStr,
    employeeType,
    supervisor,
    rawSalary,
    salaryFreq,
    rawSalaryAfter,
    salaryAfterFreq,
  };
}

/**
 * Builds the initial dynamic employment placement milestone from the real employee account profile
 * when no historical movements have been recorded yet.
 */
export function buildInitialEmploymentRecord(emp: Employee): EmployeeMovement | null {
  if (!emp.id) return null;
  const site = emp.site || emp.code_bu || (Array.isArray(emp.branches) ? emp.branches[0]?.name : emp.branches?.name) || "—";
  const effectiveDate = emp.join_date || emp.start_date || (emp as any).created_at?.split("T")[0] || new Date().toISOString().split("T")[0];

  return {
    id: `initial-${emp.id}`,
    employee_id: emp.id,
    movement_type: (emp.status === "probation" ? "probation" : "pass_probation") as any,
    title: emp.status === "probation" ? "Probation Placement" : "Initial Placement & Onboarding",
    effective_date: effectiveDate,
    previous_values: {},
    new_values: {
      site,
      department: emp.department || "—",
      role: emp.position || emp.role || "—",
      contract_type: emp.contract_type || "Standard Contract",
      employment_type: emp.employment_type || "FULL-TIME",
      supervisor: emp.line_manager || "—",
      new_salary: emp.basic_salary ?? emp.contract_rate ?? null,
      salary_after_contract: emp.contract_rate_after ?? emp.basic_salary ?? emp.contract_rate ?? null,
    },
    remarks: emp.contract_remark || `Initial employment commencement recorded for ${emp.first_name} ${emp.last_name}.`,
    created_at: new Date().toISOString(),
  };
}
