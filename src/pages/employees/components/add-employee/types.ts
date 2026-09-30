export type AddEmployeeStepId = "personal" | "org" | "compensation" | "asset";

export interface AddEmployeeStepConfig {
  id: AddEmployeeStepId;
  step: number;
  label: string;
  shortLabel: string;
  fullLabel: string;
  icon: string;
  fieldCount: number;
}

export interface ModalManagerEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  position: string | null;
  branch_id: string | null;
  bu_full_name: string | null;
  code_bu: string | null;
  branches?: { id: string; name: string } | null;
  realRole: string;
  isManager: boolean;
  isAdmin: boolean;
}

export const ADD_EMPLOYEE_STEPS: AddEmployeeStepConfig[] = [
  { id: "personal", step: 1, label: "Employee Info", shortLabel: "Employee Info", fullLabel: "Employee Info", icon: "ri-user-3-line", fieldCount: 6 },
  { id: "org", step: 2, label: "Joining Info", shortLabel: "Joining Info", fullLabel: "Joining Info", icon: "ri-briefcase-line", fieldCount: 8 },
  { id: "compensation", step: 3, label: "Payroll Info", shortLabel: "Payroll Info", fullLabel: "Payroll Info", icon: "ri-money-dollar-circle-line", fieldCount: 5 },
  { id: "asset", step: 4, label: "Asset", shortLabel: "Asset", fullLabel: "Asset", icon: "ri-computer-line", fieldCount: 4 },
];
