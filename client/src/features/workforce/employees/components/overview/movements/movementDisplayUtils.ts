import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/features/workforce/movements/types";

export function formatDMY(dateStr?: string | null): string {
  if (!dateStr || dateStr.toLowerCase() === "never") return "Never";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
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

  const startFormatted = startDate ? formatDMY(startDate) : "15/07/2026";
  const endFormatted = endDate ? formatDMY(endDate) : "Never";

  return `${cType} : ${startFormatted} - ${endFormatted}`;
}

export function formatMovementTitle(m: EmployeeMovement): string {
  if (m.title) return m.title;
  switch (m.movement_type) {
    case "pass_probation":
      return "Pass Probation";
    case "probation":
      return "Probation";
    case "transfer":
      return "Transfer";
    case "salary_adjustment":
      return "Salary Adjustment";
    case "promote":
      return "Promotion";
    case "demote":
      return "Demote";
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
    emp.site ||
    emp.code_bu ||
    (Array.isArray(emp.branches) ? emp.branches[0]?.name : emp.branches?.name) ||
    "8887";
  const department =
    newV.department ||
    newV.target_department ||
    emp.department ||
    emp.division ||
    "OPERATIONS";
  const designation =
    newV.role ||
    newV.new_role ||
    newV.position ||
    emp.position ||
    emp.employee_level ||
    emp.title ||
    "—";
  const contractTypeStr = formatContractType(m, emp);
  const employeeType = newV.employment_type || emp.employment_type || "—";
  const supervisor = newV.supervisor || newV.target_reports_to || emp.line_manager || "—";

  const rawSalary = newV.new_salary ?? newV.salary ?? emp.basic_salary ?? emp.contract_rate ?? "0";
  const salaryFreq = newV.contract_rate_frequency || emp.contract_rate_frequency || "Monthly";

  const rawSalaryAfter =
    newV.salary_after_contract ?? emp.contract_rate_after ?? "0";
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

export function buildInitialEmploymentRecord(emp: Employee): EmployeeMovement[] {
  if (!emp.id) return [];
  const site = emp.site || emp.code_bu || "—";
  const department = emp.department || emp.division || "—";
  const role = emp.position || emp.employee_level || emp.title || "—";
  const supervisor = emp.line_manager || "—";
  const contractType = emp.contract_type || "UDC";
  const employeeType = emp.employment_type || "Full Time";
  const rawSalary = emp.basic_salary ?? emp.contract_rate ?? "0";
  const rawSalaryAfter = emp.contract_rate_after ?? "0";
  const remarks = emp.contract_remark || "—";

  const joinDate = emp.join_date || emp.start_date || new Date().toISOString().split("T")[0];
  const probationDate = emp.fdc_end_date || emp.contract_end_date || joinDate;

  return [
    {
      id: `probation-${emp.id}`,
      employee_id: emp.id,
      movement_type: "pass_probation",
      title: "Pass Probation",
      effective_date: probationDate,
      previous_values: {},
      new_values: {
        site,
        department,
        role,
        contract_type: contractType,
        employment_type: employeeType,
        supervisor,
        new_salary: rawSalary,
        salary_after_contract: rawSalaryAfter,
      },
      remarks,
      created_at: new Date().toISOString(),
    },
    {
      id: `join-${emp.id}`,
      employee_id: emp.id,
      movement_type: "change_contract",
      title: "Join",
      effective_date: joinDate,
      previous_values: {},
      new_values: {
        site,
        department,
        role,
        contract_type: contractType,
        employment_type: employeeType,
        supervisor,
        new_salary: rawSalary,
        salary_after_contract: rawSalaryAfter,
      },
      remarks,
      created_at: new Date().toISOString(),
    },
  ];
}
