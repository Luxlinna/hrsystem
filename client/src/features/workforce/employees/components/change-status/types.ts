import type { MovementType } from "@/features/workforce/movements/types";

export interface BranchOption {
  id: string;
  name: string;
}

export interface CreateChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  branches?: BranchOption[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  preselectedEmployeeId?: string;
  onSuccess?: () => void;
}

export const STATUS_TYPES: { label: string; type: MovementType }[] = [
  { label: "Promotion", type: "promote" },
  { label: "Inter-Branch Transfer", type: "transfer" },
  { label: "Department Transfer", type: "transfer" },
  { label: "Pass Probation Confirmation", type: "pass_probation" },
  { label: "Salary Adjustment", type: "salary_adjustment" },
  { label: "Contract Renewal / Extension", type: "change_contract" },
  { label: "Role Reclassification", type: "promote" },
  { label: "Demotion", type: "demote" },
  { label: "Resignation / Offboarding", type: "transfer" },
];

export const EMPLOYEE_TYPES = [
  "FULL-TIME",
  "PART-TIME",
  "PROBATION",
  "INTERNSHIP",
  "CONTRACT",
  "TEMPORARY",
  "HOD",
];

export const SALARY_TYPES = ["Gross", "Net"];
