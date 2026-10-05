import type { Employee } from "../types";

export interface ApproverPerson {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

export interface ApproverStepConfig {
  id: string;
  stepNumber: number;
  stepTitle: string;
  condition: "OR" | "AND";
  approvers: ApproverPerson[];
}

export interface UserApproverFlowConfig {
  id: string;
  targetType: "global" | "department" | "employee";
  targetId?: string;
  steps: ApproverStepConfig[];
  updatedAt: string;
}

const STORAGE_KEY = "hrsystem_leave_approver_flows";

export const DEFAULT_APPROVAL_FLOW: ApproverStepConfig[] = [
  {
    id: "step-1",
    stepNumber: 1,
    stepTitle: "Step 1",
    condition: "OR",
    approvers: [
      { id: "appr-1", name: "You Steven", role: "Executive Director", avatar_url: null },
      { id: "appr-2", name: "Chea Rachana", role: "HR Admin Officer", avatar_url: null },
      { id: "appr-3", name: "Chorn Sokcheng", role: "HR Admin Officer", avatar_url: null },
    ],
  },
];

export function getStoredApproverFlow(branchId?: string | null): ApproverStepConfig[] {
  try {
    if (branchId) {
      const buKey = `${STORAGE_KEY}_${branchId}`;
      const buRaw = localStorage.getItem(buKey);
      if (buRaw) {
        const parsed = JSON.parse(buRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APPROVAL_FLOW;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_APPROVAL_FLOW;
}

export function saveApproverFlow(
  steps: ApproverStepConfig[],
  branchId?: string | null
): boolean {
  try {
    const key = branchId ? `${STORAGE_KEY}_${branchId}` : STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(steps));
    window.dispatchEvent(
      new CustomEvent("leave_approver_flow_updated", { detail: { branchId } })
    );
    return true;
  } catch {
    return false;
  }
}

export function mapEmployeeToApprover(emp: Employee): ApproverPerson {
  return {
    id: emp.id,
    name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Employee",
    role: emp.role || emp.department || "Officer",
    avatar_url: emp.avatar_url || null,
  };
}
