import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Employee, LeaveRequest } from "../types";
import { LEAVE_TYPE_CONFIG } from "../constants";

export async function notifyNewLeaveRequest({
  request,
  requester,
  actorName,
  isDirectHr,
}: {
  request: LeaveRequest | { id: string; leave_type: string; days: number; start_date: string; end_date: string; reason?: string | null };
  requester?: Employee | null;
  actorName: string;
  isDirectHr: boolean;
}) {
  const empName = requester ? `${requester.first_name} ${requester.last_name}`.trim() : actorName;
  const leaveLabel = LEAVE_TYPE_CONFIG[request.leave_type]?.label || request.leave_type;
  const durationStr = `${request.days} day(s) (${request.start_date} → ${request.end_date})`;

  // 1. In-App Notifications
  if (isDirectHr) {
    notify({
      source: "leave",
      type: "action_required",
      title: "Admin Leave Request — Final HR Approval",
      message: `${empName} (${requester?.role || "Admin"}) submitted a ${leaveLabel} leave request (${durationStr}). Directly routed to HR Division for final approval.`,
      entityId: request.id,
      skipTelegram: true,
    });
  } else if (requester?.reports_to) {
    notify({
      recipientUserId: requester.reports_to,
      source: "leave",
      type: "action_required",
      title: "New Leave Request — Endorsement Required",
      message: `${empName} submitted a ${leaveLabel} leave request (${durationStr}). Please review and endorse.`,
      entityId: request.id,
      skipTelegram: true,
    });
  } else {
    notify({
      source: "leave",
      type: "action_required",
      title: "New Leave Request — Review Required",
      message: `${empName} submitted a ${leaveLabel} leave request (${durationStr}).`,
      entityId: request.id,
      skipTelegram: true,
    });
  }

  // 2. Telegram Group: HRM_OPS_Notifications
  const actionButtonText = isDirectHr ? "Review & Approve (HR)" : "Review & Endorse";
  const statusStr = isDirectHr
    ? "Awaiting HR Division Final Approval"
    : "Awaiting Line Manager Endorsement (Step 1)";

  await notifyTelegramEvent(
    `<b>${isDirectHr ? "⭐ Admin Leave Request Submitted" : "📋 New Leave Request Submitted"}</b>\n\n` +
      `<b>Employee:</b> ${escapeTelegramHtml(empName)}\n` +
      `<b>Role / Dept:</b> ${escapeTelegramHtml(requester?.role || "Staff")} • ${escapeTelegramHtml(requester?.department || "General")}\n` +
      `<b>Leave Type:</b> ${escapeTelegramHtml(leaveLabel)}\n` +
      `<b>Duration:</b> ${durationStr}\n` +
      `<b>Status:</b> ${escapeTelegramHtml(statusStr)}\n` +
      (request.reason ? `<b>Reason:</b> ${escapeTelegramHtml(request.reason.split("\n")[0].slice(0, 150))}\n` : ""),
    { text: actionButtonText, url: hrNexusUrl(`/leave?highlight=${request.id}`) }
  );
}

export async function notifyLeaveManagerEndorsed({
  request,
  managerName,
  managerRole,
  note,
}: {
  request: LeaveRequest;
  managerName: string;
  managerRole: string;
  note?: string;
}) {
  const empName = request.employees
    ? `${request.employees.first_name} ${request.employees.last_name}`.trim()
    : "Employee";
  const leaveLabel = LEAVE_TYPE_CONFIG[request.leave_type]?.label || request.leave_type;
  const durationStr = `${request.days} day(s) (${request.start_date} → ${request.end_date})`;

  // 1. Notify the Employee that Step 1 was endorsed
  if (request.employee_id) {
    notify({
      recipientUserId: request.employee_id,
      source: "leave",
      type: "info",
      title: "Leave Endorsed by Manager",
      message: `Your line manager ${managerName} endorsed your ${leaveLabel} leave request. Forwarded to HR Division for final approval.`,
      entityId: request.id,
      skipTelegram: true,
    });
  }

  // 2. Notify HR Managers & users with leave_approve role permission
  notify({
    source: "leave",
    type: "action_required",
    title: "Step 1 Endorsed — Final HR Approval Required",
    message: `Manager ${managerName} endorsed ${empName}'s ${leaveLabel} leave (${durationStr}). Ready for final authorization.`,
    entityId: request.id,
    skipTelegram: true,
  });

  // 3. Telegram Group: HRM_OPS_Notifications
  await notifyTelegramEvent(
    `<b>📋 Step 1 Endorsed: Awaiting Final HR Approval</b>\n\n` +
      `<b>Employee:</b> ${escapeTelegramHtml(empName)}\n` +
      `<b>Leave Type:</b> ${escapeTelegramHtml(leaveLabel)}\n` +
      `<b>Duration:</b> ${durationStr}\n` +
      `<b>Endorsed By:</b> ${escapeTelegramHtml(managerName)} (${escapeTelegramHtml(managerRole)})\n` +
      (note ? `<b>Manager Note:</b> ${escapeTelegramHtml(note)}\n` : "") +
      `<b>Next Step:</b> Final sign-off by HR Division`,
    { text: "Review for Final Approval", url: hrNexusUrl(`/leave?highlight=${request.id}`) }
  );
}

export async function notifyLeaveFinalDecision({
  request,
  approverName,
  approverRole,
  isApproved,
  note,
}: {
  request: LeaveRequest;
  approverName: string;
  approverRole: string;
  isApproved: boolean;
  note?: string;
}) {
  const empName = request.employees
    ? `${request.employees.first_name} ${request.employees.last_name}`.trim()
    : "Employee";
  const leaveLabel = LEAVE_TYPE_CONFIG[request.leave_type]?.label || request.leave_type;
  const durationStr = `${request.days} day(s) (${request.start_date} → ${request.end_date})`;

  // 1. In-app notification to the employee
  if (request.employee_id) {
    notify({
      recipientUserId: request.employee_id,
      source: "leave",
      type: isApproved ? "success" : "error",
      title: isApproved ? "Leave Fully Approved" : "Leave Request Rejected",
      message: isApproved
        ? `Your ${leaveLabel} leave (${durationStr}) was granted final approval by ${approverName}.`
        : `Your ${leaveLabel} leave request was rejected by ${approverName}.${note ? ` Reason: ${note}` : ""}`,
      entityId: request.id,
      skipTelegram: true,
    });
  }

  // 2. Telegram Group: HRM_OPS_Notifications
  await notifyTelegramEvent(
    `<b>${isApproved ? "✅ Leave Request Fully Approved (HR Final)" : "❌ Leave Request Rejected"}</b>\n\n` +
      `<b>Employee:</b> ${escapeTelegramHtml(empName)}\n` +
      `<b>Leave Type:</b> ${escapeTelegramHtml(leaveLabel)}\n` +
      `<b>Duration:</b> ${durationStr}\n` +
      `<b>Authorized By:</b> ${escapeTelegramHtml(approverName)} (${escapeTelegramHtml(approverRole)})\n` +
      (note ? `<b>Note:</b> ${escapeTelegramHtml(note)}\n` : ""),
    { text: "View Leave Record", url: hrNexusUrl(`/leave?highlight=${request.id}`) }
  );
}
