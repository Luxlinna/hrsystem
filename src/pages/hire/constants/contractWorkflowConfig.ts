import type { ContractWorkflowStage } from "../types/contractTypes";

export interface ContractWorkflowStepMeta {
  order: number;
  stage: ContractWorkflowStage;
  label: string;
  shortLabel: string;
  responsible: string;
  icon: string;
  activeColor: string;
  activeBg: string;
  badgeBg: string;
}

export const CONTRACT_WORKFLOW_STEPS: ContractWorkflowStepMeta[] = [
  {
    order: 1,
    stage: "draft",
    label: "Generate Contract",
    shortLabel: "Draft",
    responsible: "HR Division / Recruiter",
    icon: "ri-file-add-line",
    activeColor: "text-blue-700",
    activeBg: "bg-blue-50 border-blue-200",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    order: 2,
    stage: "hr_review",
    label: "HR Review",
    shortLabel: "HR Review",
    responsible: "HR Division Specialist",
    icon: "ri-user-search-line",
    activeColor: "text-indigo-700",
    activeBg: "bg-indigo-50 border-indigo-200",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    order: 3,
    stage: "hr_director_approval",
    label: "HR Director Approval",
    shortLabel: "HR Director",
    responsible: "HR Director",
    icon: "ri-shield-user-line",
    activeColor: "text-amber-700",
    activeBg: "bg-amber-50 border-amber-200",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    order: 4,
    stage: "chairwoman_approval",
    label: "Chairwoman Approval",
    shortLabel: "Chairwoman",
    responsible: "Chairwoman",
    icon: "ri-award-line",
    activeColor: "text-purple-700",
    activeBg: "bg-purple-50 border-purple-200",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    order: 5,
    stage: "issued",
    label: "Contract Issued",
    shortLabel: "Issued",
    responsible: "HR Division",
    icon: "ri-mail-send-line",
    activeColor: "text-teal-700",
    activeBg: "bg-teal-50 border-teal-200",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    order: 6,
    stage: "signed",
    label: "Signature",
    shortLabel: "Signature",
    responsible: "Candidate & Company",
    icon: "ri-edit-2-line",
    activeColor: "text-cyan-700",
    activeBg: "bg-cyan-50 border-cyan-200",
    badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    order: 7,
    stage: "completed",
    label: "Completed",
    shortLabel: "Completed",
    responsible: "HR Operations",
    icon: "ri-checkbox-circle-fill",
    activeColor: "text-emerald-700",
    activeBg: "bg-emerald-50 border-emerald-200",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export const CONTRACT_STAGE_ORDER: ContractWorkflowStage[] = [
  "draft",
  "hr_review",
  "hr_director_approval",
  "chairwoman_approval",
  "issued",
  "signed",
  "completed",
];

export function getContractStepIndex(stage: ContractWorkflowStage): number {
  return CONTRACT_STAGE_ORDER.indexOf(stage);
}

export function isContractStepPassed(current: ContractWorkflowStage, target: ContractWorkflowStage): boolean {
  const currentIdx = getContractStepIndex(current);
  const targetIdx = getContractStepIndex(target);
  return currentIdx > targetIdx;
}
