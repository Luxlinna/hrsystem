import type { Employee } from "../types";
import { getLeaveEmployeeName } from "../utils/leaveDisplayUtils";
import {
  getStoredTableSteps,
  getLeaveApprovalGroups,
  convertTableStepsToApproverConfigs,
} from "./leaveApprovalGroupService";

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

export const DEFAULT_UNI_APPROVAL_FLOW: ApproverStepConfig[] = [
  {
    id: "step-1",
    stepNumber: 1,
    stepTitle: "Step 1",
    condition: "AND",
    approvers: [
      {
        id: "086198ca-89e2-477d-ba7f-f37806518bf5",
        name: "Mrs. Chea Tiengchanvathna",
        role: "Head of Department",
      },
      {
        id: "45c199c5-9319-4dd0-b3f0-8c18a5b1ff06",
        name: "Mr. Chey Tola",
        role: "Head of Division Director",
      },
      {
        id: "d1d0e910-d472-42c3-8f6e-1eef21bf6f21",
        name: "Mr. Thorng Dararithy",
        role: "HR Department",
      },
    ],
  },
];

export const DEFAULT_APPROVAL_FLOW: ApproverStepConfig[] = DEFAULT_UNI_APPROVAL_FLOW;

export function getStoredApproverFlow(
  branchId?: string | null,
  branchName?: string | null
): ApproverStepConfig[] {
  try {
    // 1. First check if any active Group Leave Approval Flow matches this site / unit
    const groups = getLeaveApprovalGroups();
    const matchedGroup = groups.find((g) => {
      if (!g.steps || g.steps.length === 0) return false;
      if (!branchName && !branchId) return true;
      const bLower = (branchName || "").toLowerCase().trim();
      const siteMatch =
        !g.site ||
        g.site.length === 0 ||
        g.site.includes("All") ||
        (bLower &&
          g.site.some(
            (s) =>
              s.toLowerCase() === bLower ||
              bLower.includes(s.toLowerCase()) ||
              s.toLowerCase().includes(bLower)
          ));
      return siteMatch;
    });

    if (matchedGroup && matchedGroup.steps && matchedGroup.steps.length > 0) {
      const converted = convertTableStepsToApproverConfigs(matchedGroup.steps);
      if (converted.length > 0) return converted;
    }

    // 2. Next check specific BU table steps
    const tableSteps = getStoredTableSteps(branchId || undefined, branchName || undefined);
    if (tableSteps && tableSteps.length > 0) {
      const condition = tableSteps.length > 1 && tableSteps[1]?.approvalCondition === "AND" ? "AND" : "OR";
      return [
        {
          id: `step-table-${branchId || branchName || "default"}`,
          stepNumber: 1,
          stepTitle: "Step 1",
          condition,
          approvers: tableSteps.map((s, idx) => ({
            id: s.id || `app-${idx}`,
            name: s.description,
            role: s.flowType === "Employee" ? "Approver" : s.flowType,
          })),
        },
      ];
    }

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

    // Default flow for UNI Holding / default BU
    const isUni =
      !branchName ||
      /uni|holding|noble/i.test(branchName) ||
      (branchId && (branchId === "cf4826f4-c8ee-4e58-a27d-1b4481eb91f7" || branchId === "e2c082b8-7b47-4210-81ab-c3ac183c4a44"));

    if (isUni) {
      return DEFAULT_UNI_APPROVAL_FLOW;
    }

    // If branchId or branchName is specified, but has no stored flow for this BU, return empty flow
    if (branchId || branchName) {
      return [];
    }

    // Global default fallback only when no branchId / branchName was provided
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
  } catch {
    // fallback if localStorage is inaccessible
  }
  return DEFAULT_UNI_APPROVAL_FLOW;
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
    if (!branchId && !branchName) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
    }

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
    name: getLeaveEmployeeName(emp),
    role: emp.position || emp.role || emp.department || "Officer",
    avatar_url: emp.avatar_url || null,
  };
}

