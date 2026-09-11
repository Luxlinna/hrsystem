import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { sendDualRecruitmentNotification } from "./recruitmentNotifyEngine";
import type { Candidate, CandidateApproval } from "../../types";

export type ApprovalStepKey = "ceo" | "hr_manager" | "division_director" | "chairwoman";

interface NotifyStepParams {
  candidate: Candidate;
  approval: CandidateApproval;
  signedStep: ApprovalStepKey;
  actorName: string;
  actorRole: string;
  isDelegated?: boolean;
}

/**
 * Triggers sequential notification when an executive or delegated staff signs a CAF step.
 * Step 1 (CEO BU) -> Alerts HR Manager
 * Step 2 (HR Manager) -> Alerts HR&Admin Division Director
 * Step 3 (HR&Admin Division Director) -> Alerts Chairwoman
 * Step 4 (Chairwoman) -> Alerts Recruiter & Stakeholders (Full Authorization)
 */
export async function notifyCandidateApprovalStepSigned({
  candidate,
  approval,
  signedStep,
  actorName,
  actorRole,
  isDelegated = false,
}: NotifyStepParams): Promise<{ title: string; message: string }> {
  const candidateName = candidate.full_name || approval.candidate_name || "Candidate";
  const position = candidate.job_postings?.title || approval.position_applied || "Position";
  const buName = approval.business_unit || candidate.job_postings?.branches?.name || "Business Unit";
  const formNum = approval.form_number ? `[${approval.form_number}] ` : "";

  const delegateTag = isDelegated ? " (Authorized Delegate)" : "";

  switch (signedStep) {
    case "ceo": {
      await sendDualRecruitmentNotification({
        title: `📋 CAF Step 1 Signed: ${formNum}${candidateName}`,
        approverMessage: `${actorName}${delegateTag} signed Step 1 (CEO of BU). Forwarded to HR Manager at HR Division for Step 2 Review.`,
        recruiterMessage: `CEO of BU endorsement complete for ${candidateName} (${position}). Forwarded to HR Manager at HR Division.`,
        type: "info",
        entityId: candidate.id,
        approverBranchId: null,
        telegramHtml:
          `🏢 <b>Candidate Approval Form: Step 1 Signed</b>\n` +
          `📄 <b>Form:</b> ${escapeTelegramHtml(formNum)}${escapeTelegramHtml(candidateName)}\n` +
          `💼 <b>Role:</b> ${escapeTelegramHtml(position)} · ${escapeTelegramHtml(buName)}\n` +
          `✍️ <b>Signed By:</b> ${escapeTelegramHtml(actorName)} (CEO of BU${delegateTag})\n` +
          `⏩ <b>Next Action:</b> Step 2 - HR Manager at HR Division Review Required`,
        telegramButtonText: "Review in HR Division",
        telegramUrl: hrNexusUrl(`/hire/candidates/${candidate.id}?openApproval=true`),
        auditAction: "caf_step1_ceo_signed",
        actorName,
        actorRole,
        description: `CAF Step 1 signed by ${actorName} for candidate ${candidateName}`,
      });
      return {
        title: "Step 1 Endorsed (CEO of BU)",
        message: `${actorName} signed Step 1. Alert forwarded to HR Manager at HR Division for review.`,
      };
    }

    case "hr_manager": {
      await sendDualRecruitmentNotification({
        title: `📑 CAF Step 2 Reviewed: ${formNum}${candidateName}`,
        approverMessage: `HR Manager ${actorName}${delegateTag} reviewed Step 2. Forwarded to HR Admin Director for Step 3 Approval.`,
        recruiterMessage: `HR Manager review complete for ${candidateName}. Forwarded to HR Admin Director.`,
        type: "info",
        entityId: candidate.id,
        approverBranchId: null,
        telegramHtml:
          `📑 <b>Candidate Approval Form: Step 2 Signed</b>\n` +
          `📄 <b>Form:</b> ${escapeTelegramHtml(formNum)}${escapeTelegramHtml(candidateName)}\n` +
          `💼 <b>Role:</b> ${escapeTelegramHtml(position)}\n` +
          `✍️ <b>Signed By:</b> ${escapeTelegramHtml(actorName)} (HR Manager at HR Division${delegateTag})\n` +
          `⏩ <b>Next Action:</b> Step 3 - HR Admin Director Approval Required`,
        telegramButtonText: "Review as HR Admin Director",
        telegramUrl: hrNexusUrl(`/hire/candidates/${candidate.id}?openApproval=true`),
        auditAction: "caf_step2_hr_signed",
        actorName,
        actorRole,
        description: `CAF Step 2 signed by ${actorName} for candidate ${candidateName}`,
      });
      return {
        title: "Step 2 Reviewed (HR Manager)",
        message: `${actorName} reviewed Step 2. Alert forwarded to HR Admin Director.`,
      };
    }

    case "division_director": {
      await sendDualRecruitmentNotification({
        title: `🏛️ CAF Step 3 Approved: ${formNum}${candidateName}`,
        approverMessage: `HR Admin Director ${actorName}${delegateTag} approved Step 3. Forwarded to Chairwoman for final executive authorization.`,
        recruiterMessage: `HR Admin Director approval complete for ${candidateName}. Escalated to Chairwoman.`,
        type: "warning",
        entityId: candidate.id,
        approverBranchId: null,
        telegramHtml:
          `🏛️ <b>Candidate Approval Form: Step 3 Signed</b>\n` +
          `📄 <b>Form:</b> ${escapeTelegramHtml(formNum)}${escapeTelegramHtml(candidateName)}\n` +
          `💼 <b>Role:</b> ${escapeTelegramHtml(position)}\n` +
          `✍️ <b>Signed By:</b> ${escapeTelegramHtml(actorName)} (HR Admin Director${delegateTag})\n` +
          `⏩ <b>Next Action:</b> Step 4 - Chairwoman Final Executive Authorization`,
        telegramButtonText: "Authorize as Chairwoman",
        telegramUrl: hrNexusUrl(`/hire/candidates/${candidate.id}?openApproval=true`),
        auditAction: "caf_step3_director_signed",
        actorName,
        actorRole,
        description: `CAF Step 3 approved by ${actorName} for candidate ${candidateName}`,
      });
      return {
        title: "Step 3 Approved (HR Admin Director)",
        message: `${actorName} approved Step 3. Alert forwarded to Chairwoman for final authorization.`,
      };
    }

    case "chairwoman": {
      await sendDualRecruitmentNotification({
        title: `👑 CAF Fully Authorized: ${formNum}${candidateName}`,
        approverMessage: `Chairwoman ${actorName}${delegateTag} signed final authorization for ${candidateName}. All 4 approvals complete! Candidate ready for Salary Negotiation.`,
        recruiterMessage: `Candidate Approval for ${candidateName} has been fully authorized by Chairwoman! Proceed to Salary Negotiation.`,
        type: "success",
        entityId: candidate.id,
        approverBranchId: null,
        telegramHtml:
          `👑 <b>Candidate Approval Form Fully Authorized!</b>\n` +
          `📄 <b>Form:</b> ${escapeTelegramHtml(formNum)}${escapeTelegramHtml(candidateName)}\n` +
          `💼 <b>Role:</b> ${escapeTelegramHtml(position)} · ${escapeTelegramHtml(buName)}\n` +
          `✍️ <b>Authorized By:</b> ${escapeTelegramHtml(actorName)} (Chairwoman${delegateTag})\n` +
          `🎯 <b>Status:</b> All 4 Executive Approvals Completed. Candidate cleared for Salary Negotiation.`,
        telegramButtonText: "Proceed to Salary Negotiation",
        telegramUrl: hrNexusUrl(`/hire/candidates/${candidate.id}?openApproval=true`),
        auditAction: "caf_step4_chairwoman_authorized",
        actorName,
        actorRole,
        description: `CAF fully authorized by Chairwoman ${actorName} for candidate ${candidateName}`,
      });
      return {
        title: "Candidate Approved (Chairwoman)",
        message: `All 4 executive signatures complete! Candidate cleared for Salary Negotiation.`,
      };
    }
  }
}
