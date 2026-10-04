import type { ContractWorkflowStage, EmploymentContract } from "../types/contractTypes";

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
    label: "HR Admin Director Approval",
    shortLabel: "HR Admin Director",
    responsible: "HR Admin Director",
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

export function formatContractDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function getContractStepAudit(
  contract: EmploymentContract | null | undefined,
  stage: ContractWorkflowStage
): { actor?: string | null; timestamp?: string | null; note?: string | null } {
  if (!contract) return {};
  switch (stage) {
    case "draft":
      return { actor: contract.created_by_name || "HR Recruiter", timestamp: contract.created_at };
    case "hr_review":
      return { actor: contract.hr_reviewer_name, timestamp: contract.hr_reviewed_at, note: contract.hr_review_notes };
    case "hr_director_approval":
      return { actor: contract.hr_director_name, timestamp: contract.hr_director_approved_at, note: contract.hr_director_notes };
    case "chairwoman_approval":
      return { actor: contract.chairwoman_name, timestamp: contract.chairwoman_approved_at, note: contract.chairwoman_notes };
    case "issued":
      return { actor: contract.issued_by_name, timestamp: contract.issued_at };
    case "signed":
      return { actor: contract.candidate_name, timestamp: contract.signed_at };
    case "completed":
      return { actor: "HR Operations", timestamp: contract.completed_at || contract.signed_at };
    default:
      return {};
  }
}
