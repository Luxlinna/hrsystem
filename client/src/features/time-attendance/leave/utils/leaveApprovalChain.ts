import type { LeaveRequest } from "../types";
import { getStoredApproverFlow } from "../services/leaveApprovalFlowService";

export type ApplicantTier = "bu_admin" | "manager" | "employee";

export function getApplicantTier(
  employee?: { role?: string | null; reports_to?: string | null } | null,
  isDirectHr?: boolean
): ApplicantTier {
  if (isDirectHr) return "bu_admin";
  const role = (employee?.role || "").toLowerCase();
  if (
    role.includes("ceo") ||
    role.includes("bu admin") ||
    role.includes("be admin") ||
    role.includes("branch admin") ||
    role.includes("super admin") ||
    role.includes("superadmin") ||
    (role.includes("bu") && (role.includes("admin") || role.includes("ceo"))) ||
    (role.includes("branch") && (role.includes("admin") || role.includes("ceo")))
  ) {
    return "bu_admin";
  }
  if (
    role.includes("manager") ||
    role.includes("supervisor") ||
    role.includes("lead") ||
    role.includes("director") ||
    role.includes("head")
  ) {
    return "manager";
  }
  return "employee";
}

export function isHrApprover(actorRole: string, hasRoleApprovalAccess = false): boolean {
  const r = (actorRole || "").toLowerCase();
  return (
    hasRoleApprovalAccess ||
    r.includes("hr manager") ||
    r.includes("hr admin") ||
    r.includes("hr officer") ||
    r.includes("hr division") ||
    r.includes("super admin") ||
    r.includes("superadmin")
  );
}

export function isBuAdminApprover(
  actorRole: string,
  isBranchAdmin = false,
  isSuperAdmin = false
): boolean {
  const r = (actorRole || "").toLowerCase();
  return (
    isBranchAdmin ||
    isSuperAdmin ||
    r.includes("ceo") ||
    r.includes("bu admin") ||
    r.includes("be admin") ||
    r.includes("branch admin") ||
    r.includes("super admin") ||
    r.includes("superadmin") ||
    (r.includes("bu") && (r.includes("admin") || r.includes("ceo"))) ||
    (r.includes("branch") && (r.includes("admin") || r.includes("ceo")))
  );
}

export function getRequestTier(request: LeaveRequest): ApplicantTier {
  const reason = request.reason || "";
  if (
    reason.includes("[Stage: Final Approved by HR Division") &&
    !reason.includes("[Stage: Manager Endorsed") &&
    !reason.includes("[Stage: BU Admin Endorsed")
  ) {
    return "bu_admin";
  }
  return getApplicantTier(request.employees);
}

export interface CanUserActOptions {
  request?: LeaveRequest | null;
  myEmployeeId?: string;
  myDepartment?: string;
  actorRole?: string;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
}

export interface CanUserActResult {
  canAct: boolean;
  actionLabel: "Approve" | "Endorse" | "BU Admin Endorse" | "HR Approve" | "";
}

export function canUserActOnRequest(opts: CanUserActOptions): CanUserActResult {
  const {
    request,
    myEmployeeId = "",
    myDepartment = "",
    actorRole = "",
    hasRoleApprovalAccess = false,
    hasManagerEndorseAccess = false,
    hasBuAdminEndorseAccess = false,
    isAdmin = false,
    isSuperAdmin = false,
    isBranchAdmin = false,
  } = opts;

  if (!request || request.status !== "pending") {
    return { canAct: false, actionLabel: "" };
  }

  // Self-approval is never permitted
  if (myEmployeeId && request.employee_id === myEmployeeId) {
    return { canAct: false, actionLabel: "" };
  }

  const roleLower = (actorRole || "").toLowerCase();
  const deptLower = (myDepartment || "").toLowerCase();

  const isSuper = Boolean(
    isSuperAdmin ||
    isAdmin ||
    roleLower.includes("super admin") ||
    roleLower.includes("superadmin")
  );

  const isHr = Boolean(
    isSuper ||
    hasRoleApprovalAccess ||
    roleLower.includes("hr manager") ||
    roleLower.includes("hr admin") ||
    roleLower.includes("hr officer") ||
    roleLower.includes("hr division") ||
    deptLower.includes("hr") ||
    deptLower.includes("human resource")
  );

  const isBuAdmin = Boolean(
    isSuper ||
    isBranchAdmin ||
    hasBuAdminEndorseAccess ||
    roleLower.includes("bu admin") ||
    roleLower.includes("be admin") ||
    roleLower.includes("branch admin") ||
    roleLower.includes("branch ceo") ||
    roleLower.includes("ceo")
  );

  const isDirectManager = Boolean(
    (myEmployeeId && request.employees?.reports_to === myEmployeeId) ||
    hasManagerEndorseAccess
  );

  // Check if current user is an explicitly configured approver in the BU flow
  const branchId = request.employees?.branch_id;
  const buFlow = getStoredApproverFlow(branchId);
  const isExplicitBUApprover = Boolean(
    myEmployeeId &&
    buFlow.some((step) => step.approvers.some((a) => a.id === myEmployeeId))
  );

  const hasMultiSteps = buFlow.length > 1;
  const reasonText = request.reason || "";
  const hasStep1Endorsed =
    reasonText.includes("[Stage: BU Admin Endorsed") ||
    reasonText.includes("[Stage: Manager Endorsed") ||
    reasonText.includes("[Stage: Step 1 Endorsed");

  // If the BU flow only has 1 step (standard), any authorized approver can directly grant final Approval
  if (!hasMultiSteps) {
    if (isExplicitBUApprover || isDirectManager || isBuAdmin || isHr) {
      return { canAct: true, actionLabel: "Approve" };
    }
    return { canAct: false, actionLabel: "" };
  }

  // Multi-step BU flow: Step 1 -> Step 2
  if (!hasStep1Endorsed) {
    const isStep1Approver = buFlow[0]?.approvers.some((a) => a.id === myEmployeeId);
    if (isStep1Approver || isDirectManager || isBuAdmin || isHr) {
      return { canAct: true, actionLabel: "Endorse" };
    }
    return { canAct: false, actionLabel: "" };
  }

  // Step 2 in multi-step flow
  const isStep2Approver = buFlow[1]?.approvers.some((a) => a.id === myEmployeeId);
  if (isStep2Approver || isBuAdmin || isHr) {
    return { canAct: true, actionLabel: "Approve" };
  }

  return { canAct: false, actionLabel: "" };
}

