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
  let title = "";
  const prev: Record<string, any> = {};
  const next: Record<string, any> = {};
  const employeeUpdates: Record<string, any> = {};

  switch (form.movement_type) {
    case "probation":
      title = `Probation Period Set (${form.probation_months || 3} Months)`;
      prev.status = employee.status || "active";
      next.status = "probation";
      next.probation_months = form.probation_months || 3;
      next.probation_end_date = form.probation_end_date;
      employeeUpdates.status = "probation";
      break;

    case "pass_probation":
      title = `Passed Probation Confirmation`;
      prev.status = employee.status || "probation";
      next.status = "active";
      next.rating = form.rating || "Good Performance";
      employeeUpdates.status = "active";
      break;

    case "transfer":
      title = `Inter-Branch / Department Transfer`;
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
      title = `Promotion to ${form.new_role || "Higher Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.new_role;
      if (form.new_grade) next.grade = form.new_grade;
      if (form.salary_increase) next.salary_increase = form.salary_increase;
      if (form.new_role) employeeUpdates.role = form.new_role;
      break;

    case "demote":
      title = `Reclassification to ${form.demote_new_role || "Adjusted Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.demote_new_role;
      next.reason = form.demote_reason;
      if (form.demote_new_role) employeeUpdates.role = form.demote_new_role;
      break;

    case "salary_adjustment":
      title = `Salary Adjustment (${form.adjustment_type || "Merit Review"})`;
      prev.salary = form.current_salary;
      next.salary = form.new_salary;
      next.currency = form.currency || "USD";
      next.adjustment_type = form.adjustment_type;
      break;

    case "change_contract":
      title = `Contract Renewal / Type Change (${form.contract_type || "Standard"})`;
      prev.contract_type = "Previous Contract";
      next.contract_type = form.contract_type;
      next.start_date = form.contract_start_date;
      next.end_date = form.contract_end_date;
      break;
  }

  return { title, prev, next, employeeUpdates };
}
