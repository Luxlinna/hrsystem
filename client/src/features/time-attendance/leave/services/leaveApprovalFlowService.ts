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

export const DEFAULT_APPROVAL_FLOW: ApproverStepConfig[] = [];

export function getStoredApproverFlow(
  branchId?: string | null,
  branchName?: string | null
): ApproverStepConfig[] {
  try {
    if (branchId) {
      const buKey = `${STORAGE_KEY}_${branchId}`;
      const buRaw = localStorage.getItem(buKey);
      if (buRaw) {
        const parsed = JSON.parse(buRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    if (branchName) {
      const nameKey = `${STORAGE_KEY}_${branchName.trim().toLowerCase()}`;
      const nameRaw = localStorage.getItem(nameKey);
      if (nameRaw) {
        const parsed = JSON.parse(nameRaw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }

    // Check global default flow key
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const hasFake = parsed.some((s) =>
          s.approvers?.some((a: ApproverPerson) => a.name === "You Steven" || a.name === "Chea Rachana")
        );
        if (!hasFake) return parsed;
      }
    }

    // Check any configured branch flow in localStorage
    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY)) {
          const buRaw = localStorage.getItem(key);
          if (buRaw) {
            try {
              const parsed = JSON.parse(buRaw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const hasFake = parsed.some((s) =>
                  s.approvers?.some((a: ApproverPerson) => a.name === "You Steven" || a.name === "Chea Rachana")
                );
                if (!hasFake) return parsed;
              }
            } catch {}
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveApproverFlow(
  steps: ApproverStepConfig[],
  branchId?: string | null,
  branchName?: string | null
): boolean {
  try {
    if (branchId) {
      localStorage.setItem(`${STORAGE_KEY}_${branchId}`, JSON.stringify(steps));
    }
    if (branchName) {
      localStorage.setItem(`${STORAGE_KEY}_${branchName.trim().toLowerCase()}`, JSON.stringify(steps));
    }
    // Always store as latest default so all views stay in sync
    localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));

    window.dispatchEvent(
      new CustomEvent("leave_approver_flow_updated", { detail: { branchId, branchName } })
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

