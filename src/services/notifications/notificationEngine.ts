import { notify } from "@/lib/notify";
import { notifyTelegramEvent, hrNexusUrl, escapeTelegramHtml } from "@/lib/telegramNotify";
import { logActivity } from "@/lib/audit";

export type CanonicalNotificationEvent =
  | "requisition_submitted"
  | "approval_pending"
  | "revision_requested"
  | "rejected"
  | "candidate_shortlisted"
  | "cv_review_required"
  | "interview_scheduled"
  | "interview_feedback_overdue"
  | "candidate_selected"
  | "salary_approval_required"
  | "offer_approved"
  | "offer_accepted"
  | "document_missing"
  | "contract_ready"
  | "contract_approved"
  | "sla_exceeded";

export interface EventConfig {
  label: string;
  emoji: string;
  icon: string;
  defaultType: "info" | "warning" | "success" | "error";
  defaultButtonText: string;
}

export const CANONICAL_EVENTS: Record<CanonicalNotificationEvent, EventConfig> = {
  requisition_submitted: {
    label: "Requisition Submitted",
    emoji: "📋",
    icon: "ri-file-add-line",
    defaultType: "info",
    defaultButtonText: "Review Requisition",
  },
  approval_pending: {
    label: "Approval Pending",
    emoji: "⏳",
    icon: "ri-time-line",
    defaultType: "warning",
    defaultButtonText: "Review & Approve",
  },
  revision_requested: {
    label: "Revision Requested",
    emoji: "🔄",
    icon: "ri-edit-line",
    defaultType: "warning",
    defaultButtonText: "View Revision Request",
  },
  rejected: {
    label: "Rejected",
    emoji: "❌",
    icon: "ri-close-circle-line",
    defaultType: "error",
    defaultButtonText: "View Details",
  },
  candidate_shortlisted: {
    label: "Candidate Shortlisted",
    emoji: "⭐",
    icon: "ri-star-line",
    defaultType: "success",
    defaultButtonText: "View Candidate Profile",
  },
  cv_review_required: {
    label: "CV Review Required",
    emoji: "📑",
    icon: "ri-file-user-line",
    defaultType: "info",
    defaultButtonText: "Screen Candidate CV",
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    emoji: "🗓️",
    icon: "ri-calendar-event-line",
    defaultType: "info",
    defaultButtonText: "View Interview Schedule",
  },
  interview_feedback_overdue: {
    label: "Interview Feedback Overdue",
    emoji: "⏰",
    icon: "ri-alarm-warning-line",
    defaultType: "warning",
    defaultButtonText: "Submit Interview Scorecard",
  },
  candidate_selected: {
    label: "Candidate Selected",
    emoji: "🎯",
    icon: "ri-user-star-line",
    defaultType: "success",
    defaultButtonText: "Proceed with Candidate",
  },
  salary_approval_required: {
    label: "Salary Approval Required",
    emoji: "💰",
    icon: "ri-money-dollar-circle-line",
    defaultType: "warning",
    defaultButtonText: "Review Salary Package",
  },
  offer_approved: {
    label: "Offer Approved",
    emoji: "🏢",
    icon: "ri-checkbox-circle-line",
    defaultType: "success",
    defaultButtonText: "View Approved Offer",
  },
  offer_accepted: {
    label: "Offer Accepted",
    emoji: "🎉",
    icon: "ri-gift-line",
    defaultType: "success",
    defaultButtonText: "Start Onboarding",
  },
  document_missing: {
    label: "Document Missing",
    emoji: "⚠️",
    icon: "ri-alert-line",
    defaultType: "warning",
    defaultButtonText: "Request Documents",
  },
  contract_ready: {
    label: "Contract Ready",
    emoji: "📜",
    icon: "ri-file-text-line",
    defaultType: "info",
    defaultButtonText: "Review Contract Draft",
  },
  contract_approved: {
    label: "Contract Approved",
    emoji: "👑",
    icon: "ri-shield-check-line",
    defaultType: "success",
    defaultButtonText: "Issue for Signature",
  },
  sla_exceeded: {
    label: "SLA Exceeded",
    emoji: "🚨",
    icon: "ri-error-warning-fill",
    defaultType: "error",
    defaultButtonText: "Investigate Delay",
  },
};

export interface NotificationDispatchPayload {
  event: CanonicalNotificationEvent;
  title: string;
  message: string;
  type?: "info" | "warning" | "success" | "error";
  entityId?: string | null;
  entityType?: string;
  entityTitle?: string;
  recipientUserId?: string | null;
  recipientRole?: string | null;
  branchId?: string | null;
  businessUnit?: string | null;
  targetBusinessUnit?: string | null;
  isCrossBu?: boolean;
  actorName?: string;
  actorRole?: string;
  actionUrl?: string;
  actionButtonText?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
  reason?: string | null;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  auditAction?: string;
  skipTelegram?: boolean;
  skipInApp?: boolean;
}

/**
 * Central Notification Engine dispatcher.
 * Delivers synchronized alerts through In-App, Telegram, and Audit Trail.
 */
export async function dispatchNotification(payload: NotificationDispatchPayload): Promise<void> {
  const config = CANONICAL_EVENTS[payload.event];
  const resolvedType = payload.type || config?.defaultType || "info";
  const resolvedButtonText = payload.actionButtonText || config?.defaultButtonText || "View in HR Nexus";
  const resolvedUrl = payload.actionUrl ? (payload.actionUrl.startsWith("http") ? payload.actionUrl : hrNexusUrl(payload.actionUrl)) : hrNexusUrl("/notifications");
  const buName = payload.businessUnit || "OPS Solutions Co ., Ltd";

  // 1. In-App Notification Delivery
  if (!payload.skipInApp) {
    try {
      await notify({
        title: payload.title,
        message: payload.message,
        type: resolvedType,
        source: "hire",
        entityId: payload.entityId || null,
        recipientUserId: payload.recipientUserId || null,
        branchId: payload.branchId ?? null,
        skipTelegram: true, // Handled centrally below with rich formatting
      });
    } catch (inAppErr) {
      console.warn("[NotificationEngine] In-app notification delivery warning:", inAppErr);
    }
  }

  // 2. Telegram Broadcast Delivery
  if (!payload.skipTelegram) {
    try {
      const lines: string[] = [];
      const emoji = config?.emoji || "📢";
      const eventLabel = config?.label || "Notification";

      lines.push(`${emoji} <b>${escapeTelegramHtml(eventLabel)}: ${escapeTelegramHtml(payload.title)}</b>`);

      if (payload.entityTitle) {
        lines.push(`📄 <b>Item:</b> ${escapeTelegramHtml(payload.entityTitle)}`);
      }

      if (payload.businessUnit) {
        if (payload.isCrossBu && payload.targetBusinessUnit) {
          lines.push(`⚡ <b>Scope:</b> Across-Site BU (${escapeTelegramHtml(payload.businessUnit)} ➔ ${escapeTelegramHtml(payload.targetBusinessUnit)})`);
        } else {
          lines.push(`🏢 <b>Business Unit:</b> ${escapeTelegramHtml(payload.businessUnit)}`);
        }
      }

      if (payload.actorName) {
        lines.push(`✍️ <b>Actor:</b> ${escapeTelegramHtml(payload.actorName)}${payload.actorRole ? ` (${escapeTelegramHtml(payload.actorRole)})` : ""}`);
      }

      if (payload.recipientRole) {
        lines.push(`🎯 <b>Action Required By:</b> ${escapeTelegramHtml(payload.recipientRole)}`);
      }

      if (payload.oldValue != null && payload.newValue != null) {
        lines.push(`🔄 <b>Change:</b> $${payload.oldValue} ➔ $${payload.newValue}`);
      }

      if (payload.reason) {
        lines.push(`💬 <b>Reason:</b> ${escapeTelegramHtml(payload.reason)}`);
      }

      if (payload.details) {
        for (const [k, v] of Object.entries(payload.details)) {
          if (v !== undefined && v !== null && v !== "") {
            lines.push(`▫️ <b>${escapeTelegramHtml(k)}:</b> ${escapeTelegramHtml(String(v))}`);
          }
        }
      }

      lines.push(`\n${escapeTelegramHtml(payload.message)}`);

      const telegramHtml = lines.join("\n");
      notifyTelegramEvent(telegramHtml, {
        text: resolvedButtonText,
        url: resolvedUrl,
      }).catch(() => {});
    } catch (teleErr) {
      console.warn("[NotificationEngine] Telegram delivery warning:", teleErr);
    }
  }

  // 3. System Audit Trail Logging
  try {
    const auditAction = payload.auditAction || payload.event;
    void logActivity({
      module: "hire",
      action: auditAction,
      entityType: payload.entityType || "notification",
      entityId: payload.entityId || undefined,
      actorName: payload.actorName || "System Notification Engine",
      actorRole: payload.actorRole || "System",
      description: payload.message,
      branchId: payload.branchId || null,
      businessUnit: payload.businessUnit || buName,
      targetBusinessUnit: payload.targetBusinessUnit || undefined,
      isCrossBu: payload.isCrossBu,
      oldValue: payload.oldValue,
      newValue: payload.newValue,
      reason: payload.reason || undefined,
      metadata: {
        canonical_event: payload.event,
        title: payload.title,
        ...(payload.details || {}),
      },
    });
  } catch (auditErr) {
    console.warn("[NotificationEngine] Audit log warning:", auditErr);
  }
}
