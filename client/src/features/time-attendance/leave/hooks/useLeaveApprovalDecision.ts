import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import {
  notifyLeaveManagerEndorsed,
  notifyLeaveFinalDecision,
} from "../services/leaveNotificationService";
import { canUserActOnRequest } from "../utils/leaveApprovalChain";
import { getLeaveEmployeeName } from "../utils/leaveDisplayUtils";
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

      const empName = getLeaveEmployeeName(selectedRequest.employees);

      if (!isApprove) {
        finalStatus = "rejected";
        stageTag = `\n\n[Stage: Rejected by ${actorName} (${actorRole})]${approvalNote ? `\n[Reject Reason: ${approvalNote}]` : ""}`;
        toastMessage = `Leave request rejected by ${actorName}`;
      } else if (actionLabel === "Endorse" || actionLabel === "BU Admin Endorse") {
        finalStatus = "pending";
        stageTag = `\n\n[Stage: Step 1 Endorsed by ${actorName} (${actorRole})]${approvalNote ? `\n[Note: ${approvalNote}]` : ""}`;
        toastMessage = "Step 1: Endorsed. Forwarded to next step for final authorization.";
      } else {
        finalStatus = "approved";
        stageTag = `\n\n[Stage: Approved by ${actorName} (${actorRole})]${approvalNote ? `\n[Approval Note: ${approvalNote}]` : ""}`;
        toastMessage = `Leave request approved by ${actorName}.`;
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
      const empName = getLeaveEmployeeName(cancelTargetRequest.employees);
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

  const handleDeleteRequest = useCallback(async (req: LeaveRequest) => {
    if (!window.confirm(`Are you sure you want to delete this ${req.leave_type} leave request?`)) return;
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorName,
        })
        .eq("id", req.id);

      if (error) throw error;

      setToast({ type: "success", message: "Leave request deleted successfully." });
      const empName = getLeaveEmployeeName(req.employees);
      logActivity({
        module: "leave",
        action: "deleted",
        entityType: "leave_request",
        entityId: req.id,
        actorName,
        actorRole,
        description: `Deleted ${req.leave_type} leave request for ${empName} (${req.days} days, ${req.start_date} to ${req.end_date})`,
      });
      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete request" });
    }
  }, [actorName, actorRole, loadData, setToast]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} selected leave request(s)?`)) return;
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: actorName,
        })
        .in("id", ids);

      if (error) throw error;

      setToast({ type: "success", message: `Deleted ${ids.length} leave request(s) successfully.` });
      logActivity({
        module: "leave",
        action: "deleted",
        entityType: "leave_request",
        actorName,
        actorRole,
        description: `Bulk deleted ${ids.length} leave requests`,
      });
      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to bulk delete requests" });
    }
  }, [actorName, actorRole, loadData, setToast]);

  const handleBulkApprove = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    if (!window.confirm(`Are you sure you want to approve ${ids.length} selected leave request(s)?`)) return;
    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
        })
        .in("id", ids);

      if (error) throw error;

      setToast({ type: "success", message: `Approved ${ids.length} leave request(s).` });
      logActivity({
        module: "leave",
        action: "approved",
        entityType: "leave_request",
        actorName,
        actorRole,
        description: `Bulk approved ${ids.length} leave requests`,
      });
      await loadData();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to bulk approve requests" });
    }
  }, [actorName, actorRole, loadData, setToast]);

  return {
    selectedRequest, setSelectedRequest, approvalNote, setApprovalNote,
    showApprovalModal, setShowApprovalModal, approvalAction, setApprovalAction,
    processingApproval, handleProcessApproval, cancelTargetRequest, setCancelTargetRequest,
    cancelReason, setCancelReason, showCancelModal, setShowCancelModal,
    processingCancel, handleCancelRequest,
    handleDeleteRequest, handleBulkDelete, handleBulkApprove,
  };
}
