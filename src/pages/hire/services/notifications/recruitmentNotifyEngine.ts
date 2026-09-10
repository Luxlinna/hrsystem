import { notify } from "@/lib/notify";
import { notifyTelegramEvent, hrNexusUrl } from "@/lib/telegramNotify";
import { logActivity } from "@/lib/audit";
import { resolveUserIdForEmployee } from "./recruitmentRecipients";

export interface DualNotifyPayload {
  title: string;
  approverMessage: string;
  recruiterMessage?: string;
  type?: "info" | "warning" | "success" | "error";
  entityId?: string | null;
  // Approver / Reviewer target
  approverUserId?: string | null;
  approverBranchId?: string | null;
  approverRole?: string | null;
  // Recruiter target
  recruiterUserId?: string | null;
  recruiterEmployeeId?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  // Telegram payload
  telegramHtml?: string;
  telegramButtonText?: string;
  telegramUrl?: string;
  // Audit log
  auditAction?: string;
  actorName?: string;
  actorRole?: string;
  description?: string;
}

/**
 * Dispatches notifications to BOTH the current stage approver and the assigned Recruiter.
 * Ensures the recruiter receives targeted delivery regardless of the originating branch.
 */
export async function sendDualRecruitmentNotification(payload: DualNotifyPayload): Promise<void> {
  const {
    title,
    approverMessage,
    recruiterMessage,
    type = "info",
    entityId,
    approverUserId,
    approverBranchId,
    recruiterUserId: rawRecruiterUserId,
    recruiterEmployeeId,
    recruiterName,
    recruiterEmail,
    telegramHtml,
    telegramButtonText = "View in HR Nexus",
    telegramUrl = hrNexusUrl("/hire"),
    auditAction,
    actorName = "System",
    actorRole = "Recruitment Engine",
    description,
  } = payload;

  try {
    // 1. Resolve Recruiter User ID if not directly provided
    let recruiterUserId = rawRecruiterUserId;
    if (!recruiterUserId && (recruiterEmployeeId || recruiterEmail || recruiterName)) {
      recruiterUserId = await resolveUserIdForEmployee({
        employeeId: recruiterEmployeeId,
        email: recruiterEmail,
        name: recruiterName,
      });
    }

    // 2. Dispatch notification to the Current Stage Approver
    await notify({
      title,
      message: approverMessage,
      type,
      source: "hire",
      entityId: entityId || null,
      recipientUserId: approverUserId || null,
      branchId: approverBranchId ?? null,
      skipTelegram: true, // We send a unified telegram alert below
    });

    // 3. Dispatch standing notification to the Assigned Recruiter
    // Only send separate notification if recruiter is distinct or has a specific user ID
    if (recruiterUserId && recruiterUserId !== approverUserId) {
      await notify({
        title: `🔔 [Recruiter Alert] ${title}`,
        message: recruiterMessage || approverMessage,
        type,
        source: "hire",
        entityId: entityId || null,
        recipientUserId: recruiterUserId,
        branchId: null, // deliver to recruiter regardless of branch
        skipTelegram: true,
      });
    }

    // 4. Unified Telegram broadcast with direct action link
    if (telegramHtml) {
      notifyTelegramEvent(telegramHtml, {
        text: telegramButtonText,
        url: telegramUrl,
      }).catch(() => {});
    }

    // 5. System Audit Trail
    if (auditAction && description) {
      logActivity({
        module: "hire",
        action: auditAction as any,
        entityType: "hiring_request",
        entityId: entityId || undefined,
        actorName,
        actorRole,
        description,
      });
    }

  } catch (err) {
    console.error("sendDualRecruitmentNotification error:", err);
  }
}
