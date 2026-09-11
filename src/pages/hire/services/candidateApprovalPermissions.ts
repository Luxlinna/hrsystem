import type { UserRole } from "@/hooks/permissions/types";
import type { CandidateApproval } from "../types";

export type ApprovalStepKey = "ceo" | "hr_manager" | "division_director" | "chairwoman";

export interface StepGateStatus {
  key: ApprovalStepKey;
  stepNumber: number;
  roleTitle: string;
  isApproved: boolean;
  isLocked: boolean;
  waitingForRoleTitle: string | null;
  canUserSign: boolean;
  requiresPermissionHint: string;
}

/**
 * Checks if the active user possesses permission to sign the given step.
 * Normal staff can sign if their role has been granted the corresponding action permission.
 */
export function canUserSignApprovalStep(
  stepKey: ApprovalStepKey,
  role: UserRole | null,
  isAdmin: boolean,
  isBranchAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (!role) return false;

  const roleName = (role.name || "").trim().toLowerCase();

  switch (stepKey) {
    case "ceo":
      return Boolean(
        role.candidate_approval_ceo_sign ||
        role.hiring_requests_branch_approve ||
        isBranchAdmin ||
        /(ceo|president|division\s*director|branch\s*admin|bu\s*admin)/i.test(roleName)
      );

    case "hr_manager":
      return Boolean(
        role.candidate_approval_hr_sign ||
        role.hiring_requests_hr_review ||
        /(hr\s*manager|talent\s*manager|recruitment\s*manager)/i.test(roleName)
      );

    case "division_director":
      return Boolean(
        role.candidate_approval_director_sign ||
        role.hiring_requests_hr_admin_approve ||
        /(hr.*director|head\s*of\s*hr)/i.test(roleName)
      );

    case "chairwoman":
      return Boolean(
        role.candidate_approval_chairwoman_sign ||
        role.hiring_requests_chairman_approve ||
        /(chair|board)/i.test(roleName)
      );

    default:
      return false;
  }
}

/**
 * Evaluates the sequential gating for all 4 Candidate Approval Form steps:
 * 1. CEO of BU signs first.
 * 2. HR and Admin Manager signs second (locked until Step 1 signed).
 * 3. HR&Admin Division Director signs third (locked until Step 2 signed).
 * 4. Chairwoman signs fourth (locked until Step 3 signed).
 */
export function evaluateApprovalStepGates(
  data: CandidateApproval | null,
  role: UserRole | null,
  isAdmin: boolean,
  isBranchAdmin: boolean
): Record<ApprovalStepKey, StepGateStatus> {
  const sigs = data?.signatories;
  const isCeoApproved = sigs?.ceo?.status === "approved";
  const isHrApproved = sigs?.hr_manager?.status === "approved";
  const isDirectorApproved = sigs?.division_director?.status === "approved";
  const isChairApproved = sigs?.chairwoman?.status === "approved";

  return {
    ceo: {
      key: "ceo",
      stepNumber: 1,
      roleTitle: sigs?.ceo?.title || "CEO (Business Unit)",
      isApproved: isCeoApproved,
      isLocked: false,
      waitingForRoleTitle: null,
      canUserSign: canUserSignApprovalStep("ceo", role, isAdmin, isBranchAdmin),
      requiresPermissionHint: "Requires CEO of BU role or authorized delegated staff permission.",
    },
    hr_manager: {
      key: "hr_manager",
      stepNumber: 2,
      roleTitle: sigs?.hr_manager?.title || "HR Manager (HR Division)",
      isApproved: isHrApproved,
      isLocked: !isCeoApproved,
      waitingForRoleTitle: "Step 1 (CEO by BU)",
      canUserSign: canUserSignApprovalStep("hr_manager", role, isAdmin, isBranchAdmin),
      requiresPermissionHint: "Requires HR Manager (HR Division) role or authorized HR staff permission.",
    },
    division_director: {
      key: "division_director",
      stepNumber: 3,
      roleTitle: sigs?.division_director?.title || "HR Admin Director",
      isApproved: isDirectorApproved,
      isLocked: !isHrApproved,
      waitingForRoleTitle: "Step 2 (HR Manager at HR Division)",
      canUserSign: canUserSignApprovalStep("division_director", role, isAdmin, isBranchAdmin),
      requiresPermissionHint: "Requires HR Admin Director role or authorized delegate permission.",
    },
    chairwoman: {
      key: "chairwoman",
      stepNumber: 4,
      roleTitle: sigs?.chairwoman?.title || "Chairwoman",
      isApproved: isChairApproved,
      isLocked: !isDirectorApproved,
      waitingForRoleTitle: "Step 3 (HR Admin Director)",
      canUserSign: canUserSignApprovalStep("chairwoman", role, isAdmin, isBranchAdmin),
      requiresPermissionHint: "Requires Chairwoman executive authorization permission.",
    },
  };
}
