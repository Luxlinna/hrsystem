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
  loadData: () => Promise<void>;
  setToast: (toast: { type: "success" | "error" | "info"; message: string } | null) => void;
}

export function useLeaveApprovalDecision({
  actorName,
  actorRole,
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
      const isApprove = approvalAction === "approved";
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: approvalAction,
          reason: approvalNote
            ? `${selectedRequest.reason || ""}\n\n[Approver Note: ${approvalNote}]`.trim()
            : selectedRequest.reason,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      setToast({
        type: "success",
        message: `Leave request ${isApprove ? "approved" : "rejected"} successfully`,
      });
      setShowApprovalModal(false);
      setApprovalNote("");

      const empName = selectedRequest.employees
        ? `${selectedRequest.employees.first_name} ${selectedRequest.employees.last_name}`
        : "Employee";

      logActivity({
        module: "leave",
        action: isApprove ? "approved" : "rejected",
        entityType: "leave_request",
        entityId: selectedRequest.id,
        actorName,
        actorRole,
        description: `${isApprove ? "Approved" : "Rejected"} ${selectedRequest.leave_type} leave request for ${empName} (${selectedRequest.days} days)`,
      });

      notify({
        source: "leave",
        type: isApprove ? "success" : "warning",
        title: `Leave Request ${isApprove ? "Approved" : "Rejected"}`,
        message: `Your ${selectedRequest.leave_type} leave (${selectedRequest.start_date} to ${selectedRequest.end_date}) was ${approvalAction} by ${actorName}`,
        entityId: selectedRequest.id,
      });

      notifyTelegramEvent(
        `<b>${isApprove ? "✅ Leave Request Approved" : "❌ Leave Request Rejected"}</b>\n\n` +
          `<b>Employee:</b> ${escapeTelegramHtml(empName)}\n` +
          `<b>Type:</b> ${escapeTelegramHtml(LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label || selectedRequest.leave_type)}\n` +
          `<b>Duration:</b> ${selectedRequest.days} day(s) (${selectedRequest.start_date} → ${selectedRequest.end_date})\n` +
          `<b>Decided By:</b> ${escapeTelegramHtml(actorName)}\n` +
          (approvalNote ? `<b>Note:</b> ${escapeTelegramHtml(approvalNote)}\n` : ""),
        { text: "View Leave", url: hrNexusUrl(`/leave?highlight=${selectedRequest.id}`) }
      );

      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to process request" });
    } finally {
      setProcessingApproval(false);
    }
  }, [selectedRequest, approvalAction, approvalNote, actorName, actorRole, loadData, setToast]);

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
