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

  const startFormatted = startDate ? formatDMY(startDate) : "15/10/2024";
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
    "8887";
  const department =
    newV.department ||
    newV.target_department ||
    m.employees?.department ||
    emp.department ||
    "OPERATIONS";
  const designation =
    newV.role ||
    newV.new_role ||
    newV.position ||
    m.employees?.role ||
    emp.position ||
    emp.role ||
    "Sale Associate 3";
  const contractTypeStr = formatContractType(m, emp);
  const employeeType = newV.employment_type || emp.employment_type || "FULL-TIME";
  const supervisor = newV.supervisor || newV.target_reports_to || emp.line_manager || "Unknown";

  const rawSalary = newV.new_salary ?? newV.salary ?? emp.basic_salary ?? emp.contract_rate ?? 200;
  const salaryFreq = newV.contract_rate_frequency || emp.contract_rate_frequency || "Monthly";

  const rawSalaryAfter =
    newV.salary_after_contract ?? emp.contract_rate_after ?? rawSalary ?? 210;
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

export function buildFallbackMovements(employee: Employee): EmployeeMovement[] {
  const name = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
  const site = employee.site || employee.code_bu || "8887";
  const dept = employee.department || "OPERATIONS";
  const role = employee.position || employee.role || "Sale Associate 3";
  const cType = employee.contract_type || "PERMANENT (UDC)";

  return [
    {
      id: "mock-1",
      employee_id: employee.id,
      movement_type: "resignation" as any,
      title: "Resignation",
      effective_date: "2025-12-13",
      previous_values: {},
      new_values: { site, department: dept, role, contract_type: cType, employment_type: "FULL-TIME", supervisor: "Unknown", new_salary: 200, salary_after_contract: 210 },
      remarks: "Yes, I resigned because I wanted to find a morning job and gain more experience related to my university major. Request Date: 12 November 2025 Last Working Day: 12 December 2025",
      created_at: "2025-12-13T00:00:00Z",
    },
    {
      id: "mock-2",
      employee_id: employee.id,
      movement_type: "transfer" as any,
      title: "Transfer",
      effective_date: "2025-10-08",
      previous_values: {},
      new_values: { site, department: dept, role, contract_type: cType, employment_type: "FULL-TIME", supervisor: "Unknown", new_salary: 200, salary_after_contract: 210 },
      remarks: `Transfer to store ${site} on 8-Oct-2025`,
      created_at: "2025-10-08T00:00:00Z",
    },
    {
      id: "mock-3",
      employee_id: employee.id,
      movement_type: "salary_adjustment" as any,
      title: "Salary Adjustment",
      effective_date: "2025-07-04",
      previous_values: {},
      new_values: { site: "PP000050", department: dept, role, contract_type: cType, employment_type: "FULL-TIME", supervisor: "Unknown", new_salary: 200, salary_after_contract: 210 },
      remarks: "Increase salary from 200$ to 210$ reason length service Increase",
      created_at: "2025-07-04T00:00:00Z",
    },
    {
      id: "mock-4",
      employee_id: employee.id,
      movement_type: "transfer" as any,
      title: "Transfer",
      effective_date: "2024-12-11",
      previous_values: {},
      new_values: { site: "PP000050", department: dept, role, contract_type: cType, employment_type: "FULL-TIME", supervisor: "Unknown", new_salary: 200, salary_after_contract: 200 },
      remarks: "Transfer assignment to central hub PP000050",
      created_at: "2024-12-11T00:00:00Z",
    },
    {
      id: "mock-5",
      employee_id: employee.id,
      movement_type: "pass_probation" as any,
      title: "Pass Probation",
      effective_date: "2024-10-15",
      previous_values: {},
      new_values: { site: "PP000050", department: dept, role, contract_type: cType, employment_type: "FULL-TIME", supervisor: "Unknown", new_salary: 200, salary_after_contract: 200 },
      remarks: `${name} successfully confirmed upon completing probationary review evaluation.`,
      created_at: "2024-10-15T00:00:00Z",
    },
  ] as EmployeeMovement[];
}

