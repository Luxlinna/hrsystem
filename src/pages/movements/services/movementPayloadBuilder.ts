import type { MovementFormData } from "../types";

export interface MovementEmployeeInput {
  id: string;
  first_name: string;
  last_name: string;
  role?: string | null;
  department?: string | null;
  branch_id?: string | null;
  default_work_location_id?: string | null;
  status?: string | null;
  branches?: { name: string } | null;
  work_locations?: { name: string } | null;
  avatar_url?: string | null;
}

export interface MovementChanges {
  title: string;
  prev: Record<string, any>;
  next: Record<string, any>;
  employeeUpdates: Record<string, any>;
}

export function buildMovementChanges(
  form: MovementFormData,
  employee: MovementEmployeeInput
): MovementChanges {
  let title = form.title || "";
  const prev: Record<string, any> = {};
  const next: Record<string, any> = {};
  const employeeUpdates: Record<string, any> = {};

  switch (form.movement_type) {
    case "probation":
      title = title || `Probation Period Set (${form.probation_months || 3} Months)`;
      prev.status = employee.status || "active";
      next.status = "probation";
      next.probation_months = form.probation_months || 3;
      next.probation_end_date = form.probation_end_date;
      employeeUpdates.status = "probation";
      break;

    case "pass_probation":
      title = title || `Passed Probation Confirmation`;
      prev.status = employee.status || "probation";
      next.status = "active";
      next.rating = form.rating || "Good Performance";
      employeeUpdates.status = "active";
      break;

    case "transfer":
      title = title || `Inter-Branch / Department Transfer`;
      prev.branch_id = employee.branch_id;
      prev.branch_name = employee.branches?.name || "Main Branch";
      prev.department = employee.department || "General";
      next.branch_id = form.target_branch_id || employee.branch_id;
      next.department = form.target_department || employee.department;
      next.work_location_id = form.target_work_location_id;
      if (form.target_branch_id) employeeUpdates.branch_id = form.target_branch_id;
      if (form.target_department) employeeUpdates.department = form.target_department;
      if (form.target_work_location_id) employeeUpdates.default_work_location_id = form.target_work_location_id;
      break;

    case "promote":
      title = title || `Promotion to ${form.new_role || "Higher Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.new_role;
      if (form.new_grade) next.grade = form.new_grade;
      if (form.salary_increase) next.salary_increase = form.salary_increase;
      if (form.new_role) employeeUpdates.role = form.new_role;
      break;

    case "demote":
      title = title || `Reclassification to ${form.demote_new_role || "Adjusted Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.demote_new_role;
      next.reason = form.demote_reason;
      if (form.demote_new_role) employeeUpdates.role = form.demote_new_role;
      break;

    case "salary_adjustment":
      title = title || `Salary Adjustment (${form.adjustment_type || "Merit Review"})`;
      prev.salary = form.current_salary;
      next.salary = form.new_salary;
      next.currency = form.currency || "USD";
      next.adjustment_type = form.adjustment_type;
      break;

    case "change_contract":
      title = title || `Contract Renewal / Type Change (${form.contract_type || "Standard"})`;
      prev.contract_type = "Previous Contract";
      next.contract_type = form.contract_type;
      next.start_date = form.contract_start_date;
      next.end_date = form.contract_end_date;
      break;
  }

  // Apply unified structure fields
  if (form.site) { next.site = form.site; employeeUpdates.site = form.site; }
  if (form.department) { next.department = form.department; employeeUpdates.department = form.department; }
  if (form.designation) {
    next.role = form.designation;
    employeeUpdates.role = form.designation;
    employeeUpdates.position = form.designation;
  }
  if (form.contract_type) { next.contract_type = form.contract_type; employeeUpdates.contract_type = form.contract_type; }
  if (form.contract_start_date) { next.contract_start_date = form.contract_start_date; employeeUpdates.contract_effective_date = form.contract_start_date; }
  if (form.contract_end_date) { next.contract_end_date = form.contract_end_date; employeeUpdates.contract_end_date = form.contract_end_date; }
  if (form.employee_type) { next.employment_type = form.employee_type; employeeUpdates.employment_type = form.employee_type; }
  if (form.supervisor) { next.supervisor = form.supervisor; employeeUpdates.line_manager = form.supervisor; }
  if (form.salary != null) {
    next.new_salary = form.salary;
    employeeUpdates.basic_salary = form.salary;
    employeeUpdates.contract_rate = form.salary;
  }
  if (form.salary_freq) { next.contract_rate_frequency = form.salary_freq; employeeUpdates.contract_rate_frequency = form.salary_freq; }
  if (form.salary_after != null) {
    next.salary_after_contract = form.salary_after;
    employeeUpdates.contract_rate_after = form.salary_after;
  }
  if (form.salary_after_freq) {
    next.contract_rate_after_frequency = form.salary_after_freq;
    employeeUpdates.contract_rate_after_frequency = form.salary_after_freq;
  }
  if (form.remarks) { employeeUpdates.contract_remark = form.remarks; }

  return { title: title || "Personnel Movement", prev, next, employeeUpdates };
}
