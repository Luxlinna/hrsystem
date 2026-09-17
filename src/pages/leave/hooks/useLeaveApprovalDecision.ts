import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { LeaveRequest } from "../types";
import { LEAVE_TYPE_CONFIG } from "../constants";

interface UseLeaveApprovalDecisionProps {
  actorName: string;
  actorRole: string;
  canApproveLeave?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  loadData: () => Promise<void>;
  setToast: (toast: { type: "success" | "error" | "info"; message: string } | null) => void;
}

export function useLeaveApprovalDecision({
  actorName,
  actorRole,
  canApproveLeave,
  isAdmin,
  isSuperAdmin,
  hasRoleApprovalAccess,
  loadData,
  setToast,
}: UseLeaveApprovalDecisionProps) {
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
  const [processingApproval, setProcessingApproval] = useState(false);

  const [cancelTargetRequest, setCancelTargetRequest] = useState<LeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);

  const handleProcessApproval = useCallback(async () => {
    if (!selectedRequest) return;
    setProcessingApproval(true);
    try {
      const isSuperAdminRole =
        isSuperAdmin ||
        actorRole?.toLowerCase().includes("super admin") ||
        actorRole?.toLowerCase().includes("superadmin");

      const isHrManager =
        actorRole?.toLowerCase().includes("hr manager") ||
        actorRole?.toLowerCase().includes("hr admin") ||
        actorRole?.toLowerCase().includes("hr officer") ||
        actorRole?.toLowerCase().includes("director");

      // Can be HR manager, or the one who has this access at role permission
      const hasPermissionAccess =
        isAdmin ||
        canApproveLeave ||
        hasRoleApprovalAccess ||
        isHrManager;

      const isFinalApprover = isSuperAdminRole || hasPermissionAccess;

      const isApprove = approvalAction === "approved";
      const hasManagerEndorsed = (selectedRequest.reason || "").includes("[Stage: Manager Endorsed");

      let finalStatus: "pending" | "approved" | "rejected" = approvalAction;
      let stageTag = "";
      let toastMessage = "";
      let notifyTitle = "";
      let notifyMessage = "";

      const empName = selectedRequest.employees
        ? `${selectedRequest.employees.first_name} ${selectedRequest.employees.last_name}`
        : "Employee";

      if (!isApprove) {
        // Rejection at any step
        finalStatus = "rejected";
        stageTag = `\n\n[Stage: Rejected by ${actorName} (${actorRole})]${
          approvalNote ? `\n[Reject Reason: ${approvalNote}]` : ""
        }`;
        toastMessage = `Leave request rejected by ${actorName}`;
        notifyTitle = "Leave Request Rejected";
        notifyMessage = `Your ${selectedRequest.leave_type} leave was rejected by ${actorName}.`;
      } else if (!isFinalApprover && !hasManagerEndorsed) {
        // Step 1: Manager Endorsement (Leaves status as 'pending' for Step 2 HR review)
        finalStatus = "pending";
        stageTag = `\n\n[Stage: Manager Endorsed by ${actorName} (${actorRole})]${
          approvalNote ? `\n[Manager Note: ${approvalNote}]` : ""
        }`;
        toastMessage = "Step 1: Endorsed by Manager. Forwarded for HR / Role Permission final approval.";
        notifyTitle = "Leave Endorsed by Manager";
        notifyMessage = `Manager ${actorName} endorsed ${empName}'s leave request. Ready for final approval.`;
      } else {
        // Step 2: Final HR / Role Permission Approval (or Super Admin Direct Approval)
        finalStatus = "approved";
        stageTag = `\n\n[Stage: Final Approved by ${actorName} (${actorRole})]${
          approvalNote ? `\n[Approval Note: ${approvalNote}]` : ""
        }`;
        toastMessage = "Step 2: Granted final approval (HR / Role Permission).";
        notifyTitle = "Leave Request Fully Approved";
        notifyMessage = `Your ${selectedRequest.leave_type} leave was granted final approval by ${actorName}.`;
      }

      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: finalStatus,
          reason: `${selectedRequest.reason || ""}${stageTag}`.trim(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      setToast({
        type: finalStatus === "rejected" ? "error" : "success",
        message: toastMessage,
      });
      setShowApprovalModal(false);
      setApprovalNote("");

      logActivity({
        module: "leave",
        action: finalStatus,
        entityType: "leave_request",
        entityId: selectedRequest.id,
        actorName,
        actorRole,
        description: `${toastMessage} for ${empName} (${selectedRequest.days} days)`,
      });

      notify({
        source: "leave",
        type: finalStatus === "approved" ? "success" : finalStatus === "rejected" ? "error" : "info",
        title: notifyTitle,
        message: notifyMessage,
        entityId: selectedRequest.id,
        skipTelegram: true,
      });

      notifyTelegramEvent(
        `<b>${
          finalStatus === "approved"
            ? "✅ Leave Request Approved (Final HR)"
            : finalStatus === "rejected"
            ? "❌ Leave Request Rejected"
            : "📋 Step 1: Leave Endorsed by Manager"
        }</b>\n\n` +
          `<b>Employee:</b> ${escapeTelegramHtml(empName)}\n` +
          `<b>Type:</b> ${escapeTelegramHtml(
            LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label || selectedRequest.leave_type
          )}\n` +
          `<b>Duration:</b> ${selectedRequest.days} day(s) (${selectedRequest.start_date} → ${selectedRequest.end_date})\n` +
          `<b>Reviewer:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
          (approvalNote ? `<b>Note:</b> ${escapeTelegramHtml(approvalNote)}\n` : ""),
        { text: "View Leave", url: hrNexusUrl(`/leave?highlight=${selectedRequest.id}`) }
      );

      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to process request" });
    } finally {
      setProcessingApproval(false);
    }
  }, [selectedRequest, approvalAction, approvalNote, actorName, actorRole, canApproveLeave, hasRoleApprovalAccess, isAdmin, isSuperAdmin, loadData, setToast]);

  const handleCancelRequest = useCallback(async () => {
    if (!cancelTargetRequest) return;
    setProcessingCancel(true);
    try {
      const combinedReason = cancelReason.trim()
        ? `${cancelTargetRequest.reason || ""}\n\n[Cancelled by employee: ${cancelReason.trim()}]`.trim()
        : cancelTargetRequest.reason;

      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "cancelled", reason: combinedReason })
        .eq("id", cancelTargetRequest.id);

      if (error) throw error;

      setToast({ type: "success", message: "Leave request cancelled." });
      setShowCancelModal(false);
      setCancelTargetRequest(null);
      setCancelReason("");

      const empName = cancelTargetRequest.employees
        ? `${cancelTargetRequest.employees.first_name} ${cancelTargetRequest.employees.last_name}`
        : "Employee";

      logActivity({
        module: "leave",
        action: "cancelled" as any,
        entityType: "leave_request",
        entityId: cancelTargetRequest.id,
        actorName,
        actorRole,
        description: `Cancelled ${cancelTargetRequest.leave_type} leave request for ${empName} (${cancelTargetRequest.days} days)`,
      });

      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to cancel request" });
    } finally {
      setProcessingCancel(false);
    }
  }, [cancelTargetRequest, cancelReason, actorName, actorRole, loadData, setToast]);

  return {
    selectedRequest,
    setSelectedRequest,
    approvalNote,
    setApprovalNote,
    showApprovalModal,
    setShowApprovalModal,
    approvalAction,
    setApprovalAction,
    processingApproval,
    handleProcessApproval,
    cancelTargetRequest,
    setCancelTargetRequest,
    cancelReason,
    setCancelReason,
    showCancelModal,
    setShowCancelModal,
    processingCancel,
    handleCancelRequest,
  };
}
