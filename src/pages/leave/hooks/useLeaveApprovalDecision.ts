import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import {
  notifyLeaveManagerEndorsed,
  notifyLeaveFinalDecision,
} from "../services/leaveNotificationService";
import { canUserActOnRequest } from "../utils/leaveApprovalChain";
import type { LeaveRequest } from "../types";

interface UseLeaveApprovalDecisionProps {
  actorName: string;
  actorRole: string;
  myEmployeeId?: string;
  myDepartment?: string;
  canApproveLeave?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
  loadData: () => Promise<void>;
  setToast: (toast: { type: "success" | "error" | "info"; message: string } | null) => void;
}

export function useLeaveApprovalDecision({
  actorName,
  actorRole,
  myEmployeeId,
  myDepartment,
  canApproveLeave,
  isAdmin,
  isSuperAdmin,
  isBranchAdmin,
  hasRoleApprovalAccess,
  hasManagerEndorseAccess,
  hasBuAdminEndorseAccess,
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
      const { canAct, actionLabel } = canUserActOnRequest({
        request: selectedRequest,
        myEmployeeId,
        myDepartment,
        actorRole,
        hasRoleApprovalAccess,
        hasManagerEndorseAccess,
        hasBuAdminEndorseAccess,
        isAdmin,
        isSuperAdmin,
        isBranchAdmin,
      });

      if (!canAct) {
        setToast({
          type: "error",
          message: "Unauthorized: You do not have permission to act on this stage of the leave request.",
        });
        setProcessingApproval(false);
        return;
      }

      const isApprove = approvalAction === "approved";
      let finalStatus: "pending" | "approved" | "rejected" = approvalAction;
      let stageTag = "";
      let toastMessage = "";

      const empName = selectedRequest.employees
        ? `${selectedRequest.employees.first_name} ${selectedRequest.employees.last_name}`
        : "Employee";

      if (!isApprove) {
        finalStatus = "rejected";
        stageTag = `\n\n[Stage: Rejected by ${actorName} (${actorRole})]${approvalNote ? `\n[Reject Reason: ${approvalNote}]` : ""}`;
        toastMessage = `Leave request rejected by ${actorName}`;
      } else if (actionLabel === "Endorse") {
        finalStatus = "pending";
        stageTag = `\n\n[Stage: Manager Endorsed by ${actorName} (${actorRole})]${approvalNote ? `\n[Manager Note: ${approvalNote}]` : ""}`;
        toastMessage = "Step 1: Endorsed by Manager. Forwarded to HR Division for final approval.";
      } else if (actionLabel === "BU Admin Endorse") {
        finalStatus = "pending";
        stageTag = `\n\n[Stage: BU Admin Endorsed by ${actorName} (${actorRole})]${approvalNote ? `\n[BU Admin Note: ${approvalNote}]` : ""}`;
        toastMessage = "Step 1: Endorsed by BU Admin. Forwarded to HR Division for final approval.";
      } else {
        finalStatus = "approved";
        stageTag = `\n\n[Stage: Final Approved by HR Division (${actorName}, ${actorRole})]${approvalNote ? `\n[Approval Note: ${approvalNote}]` : ""}`;
        toastMessage = "Final approval granted by HR Division team.";
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

      if (isApprove && finalStatus === "pending") {
        await notifyLeaveManagerEndorsed({
          request: selectedRequest,
          managerName: actorName,
          managerRole: actorRole,
          note: approvalNote,
          isBuAdminEndorsement: actionLabel === "BU Admin Endorse",
        });
      } else {
        await notifyLeaveFinalDecision({
          request: selectedRequest,
          approverName: actorName,
          approverRole: actorRole,
          isApproved: isApprove,
          note: approvalNote,
        });
      }

      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to process request" });
    } finally {
      setProcessingApproval(false);
    }
  }, [selectedRequest, approvalAction, approvalNote, actorName, actorRole, myEmployeeId, myDepartment, hasRoleApprovalAccess, hasManagerEndorseAccess, hasBuAdminEndorseAccess, isAdmin, isSuperAdmin, isBranchAdmin, loadData, setToast]);

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
      setShowCancelModal(false); setCancelTargetRequest(null); setCancelReason("");
      const empName = cancelTargetRequest.employees ? `${cancelTargetRequest.employees.first_name} ${cancelTargetRequest.employees.last_name}` : "Employee";
      logActivity({
        module: "leave", action: "cancelled" as any, entityType: "leave_request",
        entityId: cancelTargetRequest.id, actorName, actorRole,
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
    selectedRequest, setSelectedRequest, approvalNote, setApprovalNote,
    showApprovalModal, setShowApprovalModal, approvalAction, setApprovalAction,
    processingApproval, handleProcessApproval, cancelTargetRequest, setCancelTargetRequest,
    cancelReason, setCancelReason, showCancelModal, setShowCancelModal,
    processingCancel, handleCancelRequest,
  };
}
