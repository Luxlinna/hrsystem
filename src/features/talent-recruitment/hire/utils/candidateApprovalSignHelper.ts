import type { Candidate, CandidateApproval, CandidateApprovalSignatory } from "../types";
import { saveCandidateApproval } from "../services/candidateApprovalService";
import { notifyCandidateApprovalStepSigned } from "../services/notifications/candidateApprovalEventTriggers";
import { exportCandidateApprovalPdf } from "../exports/exportCandidateApprovalPdf";
import { exportCandidateApprovalWord } from "../exports/exportCandidateApprovalWord";
import { isExportAtHrDivision } from "@/services/formLogoService";
import type { ApprovalStepKey, StepGateStatus } from "../services/candidateApprovalPermissions";

export function syncCandidateApprovalSignatories(params: {
  res: CandidateApproval;
  currentUserName?: string;
  roleName: string;
  isBranchAdmin?: boolean;
  role?: any;
}): CandidateApproval {
  const { res, currentUserName, roleName, isBranchAdmin, role } = params;
  if (!currentUserName) return res;

  const updatedSigs = { ...res.signatories };
  let changed = false;

  // Step 1: BU CEO / Branch Admin
  if (updatedSigs.ceo && updatedSigs.ceo.status !== "approved") {
    if (isBranchAdmin || /(bu\s*ceo|ceo|branch\s*admin)/i.test(roleName) || role?.candidate_approval_ceo_sign) {
      if (updatedSigs.ceo.assigned_name !== currentUserName) {
        updatedSigs.ceo.assigned_name = currentUserName;
        changed = true;
      }
    }
  }

  // Step 2: HR Manager
  if (updatedSigs.hr_manager && updatedSigs.hr_manager.status !== "approved") {
    if (/(hr\s*manager|talent\s*manager)/i.test(roleName) || role?.candidate_approval_hr_sign) {
      if (updatedSigs.hr_manager.assigned_name !== currentUserName) {
        updatedSigs.hr_manager.assigned_name = currentUserName;
        changed = true;
      }
    }
  }

  // Step 3: HR Admin Director
  if (updatedSigs.division_director && updatedSigs.division_director.status !== "approved") {
    if (/(hr.*director|division\s*director)/i.test(roleName) || role?.candidate_approval_director_sign) {
      if (updatedSigs.division_director.assigned_name !== currentUserName) {
        updatedSigs.division_director.assigned_name = currentUserName;
        changed = true;
      }
    }
  }

  // Step 4: Chairwoman
  if (updatedSigs.chairwoman && updatedSigs.chairwoman.status !== "approved") {
    if (/(chair|board)/i.test(roleName) || role?.candidate_approval_chairwoman_sign) {
      if (updatedSigs.chairwoman.assigned_name !== currentUserName) {
        updatedSigs.chairwoman.assigned_name = currentUserName;
        changed = true;
      }
    }
  }

  return changed ? { ...res, signatories: updatedSigs } : res;
}

export async function executeSignApprovalStep(params: {
  data: CandidateApproval;
  roleKey: keyof CandidateApproval["signatories"];
  stepGates: Record<ApprovalStepKey, StepGateStatus>;
  currentUserName: string;
  role?: any;
  candidate: Candidate;
}): Promise<{ saved: CandidateApproval; notifyRes: { title: string; message: string } }> {
  const { data, roleKey, stepGates, currentUserName, role, candidate } = params;
  const stepKey = roleKey as ApprovalStepKey;
  const gate = stepGates[stepKey];

  if (gate.isLocked) {
    throw new Error(`Step Locked: Please complete ${gate.waitingForRoleTitle} first.`);
  }

  if (!gate.canUserSign) {
    throw new Error(`Permission Denied: ${gate.requiresPermissionHint}`);
  }

  const now = new Date().toISOString();
  const currentSig = data.signatories[roleKey];
  const roleName = (role?.name || "").trim();

  const isRoleHolder =
    (stepKey === "ceo" && /(ceo|bu\s*ceo|branch\s*admin)/i.test(roleName)) ||
    (stepKey === "hr_manager" && /(hr\s*manager|talent\s*manager)/i.test(roleName)) ||
    (stepKey === "division_director" && /(hr.*director|division\s*director)/i.test(roleName)) ||
    (stepKey === "chairwoman" && /(chair|board)/i.test(roleName));

  const isDelegated = !isRoleHolder && Boolean(
    currentUserName && currentSig.assigned_name && currentUserName !== currentSig.assigned_name
  );

  const checkedBy = isDelegated
    ? `${currentUserName} (Staff Delegate)`
    : currentUserName;

  const updatedSig: CandidateApprovalSignatory = {
    ...currentSig,
    status: "approved",
    assigned_name: isRoleHolder ? currentUserName : currentSig.assigned_name,
    checked_by: checkedBy,
    signed_at: now,
  };

  const updated: CandidateApproval = {
    ...data,
    signatories: {
      ...data.signatories,
      [roleKey]: updatedSig,
    },
  };

  const saved = await saveCandidateApproval(updated);

  const notifyRes = await notifyCandidateApprovalStepSigned({
    candidate,
    approval: saved,
    signedStep: stepKey,
    actorName: currentUserName,
    actorRole: role?.name || "Staff",
    isDelegated,
  });

  return { saved, notifyRes };
}

export async function executeApproveAllSteps(
  data: CandidateApproval,
  currentUserName: string
): Promise<CandidateApproval> {
  const now = new Date().toISOString();
  const sigs = { ...data.signatories };

  (Object.keys(sigs) as Array<keyof typeof sigs>).forEach((k) => {
    sigs[k] = {
      ...sigs[k],
      status: "approved",
      checked_by: sigs[k].checked_by || currentUserName,
      signed_at: sigs[k].signed_at || now,
    };
  });

  const updated: CandidateApproval = {
    ...data,
    signatories: sigs,
    status: "approved",
    completed_at: now,
  };

  return await saveCandidateApproval(updated);
}

export function exportApprovalAsPdf(data: CandidateApproval) {
  const isHr = isExportAtHrDivision({ businessUnit: data.business_unit, department: data.department });
  exportCandidateApprovalPdf(data, isHr);
}

export async function exportApprovalAsWord(data: CandidateApproval) {
  const isHr = isExportAtHrDivision({ businessUnit: data.business_unit, department: data.department });
  await exportCandidateApprovalWord(data, isHr);
}

