import type { Employee, LeaveRequest } from "../types";

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
  actionLabel: "Endorse" | "BU Admin Endorse" | "HR Approve" | "";
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
    isAdmin ||
    isBranchAdmin ||
    hasBuAdminEndorseAccess ||
    roleLower.includes("bu admin") ||
    roleLower.includes("be admin") ||
    roleLower.includes("branch admin") ||
    roleLower.includes("branch ceo")
  );

  const isDirectManager = Boolean(
    (myEmployeeId && request.employees?.reports_to === myEmployeeId) ||
    hasManagerEndorseAccess
  );

  const tier = getRequestTier(request);
  const reasonText = request.reason || "";
  const hasStep1Endorsed =
    reasonText.includes("[Stage: BU Admin Endorsed") ||
    reasonText.includes("[Stage: Manager Endorsed");

  // Tier 1: BU Admin applicant -> Direct 1-step to HR Division Team only
  if (tier === "bu_admin") {
    if (isHr) return { canAct: true, actionLabel: "HR Approve" };
    return { canAct: false, actionLabel: "" };
  }

  // Tier 2: Manager applicant -> Step 1 (BU Admin) -> Step 2 (HR Division Team)
  if (tier === "manager") {
    if (!hasStep1Endorsed) {
      if (isBuAdmin || isHr) return { canAct: true, actionLabel: "BU Admin Endorse" };
      return { canAct: false, actionLabel: "" };
    }
    // Step 2: ONLY HR Division Team
    if (isHr) return { canAct: true, actionLabel: "HR Approve" };
    return { canAct: false, actionLabel: "" };
  }

  // Tier 3: Employee applicant -> Step 1 (Line Manager) -> Step 2 (HR Division Team)
  if (!hasStep1Endorsed) {
    if (isDirectManager || isBuAdmin || isHr) {
      return { canAct: true, actionLabel: "Endorse" };
    }
    return { canAct: false, actionLabel: "" };
  }

  // Step 2: ONLY HR Division Team can approve or reject.
  // The line manager who endorsed in Step 1 has NO approval rights here.
  if (isHr) return { canAct: true, actionLabel: "HR Approve" };
  return { canAct: false, actionLabel: "" };
}

