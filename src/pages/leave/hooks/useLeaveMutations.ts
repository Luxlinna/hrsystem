import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { LeaveRequest, Employee, LeaveFormData } from "../types";
import { INITIAL_LEAVE_FORM, LEAVE_TYPE_CONFIG } from "../constants";
import { calculateDays, rangesOverlap } from "../dateUtils";

interface UseLeaveMutationsProps {
  requests: LeaveRequest[];
  employees: Employee[];
  myEmployee: Employee | null;
  actorName: string;
  actorRole: string;
  getRemaining: (employeeId: string, type: string) => number | null;
  loadData: () => Promise<void>;
  setToast: (toast: { type: "success" | "error" | "info"; message: string } | null) => void;
}

export function useLeaveMutations({
  requests,
  employees,
  myEmployee,
  actorName,
  actorRole,
  getRemaining,
  loadData,
  setToast,
}: UseLeaveMutationsProps) {
  // Request Form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<LeaveFormData>(INITIAL_LEAVE_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Approval Modal
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approved" | "rejected">("approved");
  const [processingApproval, setProcessingApproval] = useState(false);

  // Cancellation Modal
  const [cancelTargetRequest, setCancelTargetRequest] = useState<LeaveRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);

  // Inspection Modal
  const [inspectRequest, setInspectRequest] = useState<LeaveRequest | null>(null);

  const handleSubmitRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const targetEmpId = formData.employee_id || myEmployee?.id;
      if (!targetEmpId) {
        setToast({ type: "error", message: "Please select an employee" });
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        setToast({ type: "error", message: "Please select start and end dates" });
        return;
      }
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setToast({ type: "error", message: "End date cannot be before start date" });
        return;
      }

      const days = calculateDays(formData.start_date, formData.end_date);
      const remaining = getRemaining(targetEmpId, formData.leave_type);
      if (remaining !== null && days > remaining) {
        setToast({
          type: "error",
          message: `Requested ${days} days exceeds remaining allowance (${remaining} days available).`,
        });
        return;
      }

      const overlap = requests.find(
        (r) =>
          r.employee_id === targetEmpId &&
          ["pending", "approved"].includes(r.status) &&
          rangesOverlap(formData.start_date, formData.end_date, r.start_date, r.end_date)
      );

      if (overlap) {
        setToast({
          type: "error",
          message: `Dates overlap with an existing ${overlap.status} request (${overlap.start_date} to ${overlap.end_date}).`,
        });
        return;
      }

      setSubmitting(true);
      try {
        const { data, error } = await supabase
          .from("leave_requests")
          .insert([
            {
              employee_id: targetEmpId,
              leave_type: formData.leave_type,
              start_date: formData.start_date,
              end_date: formData.end_date,
              days,
              reason: formData.reason || null,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setToast({ type: "success", message: "Leave request submitted successfully" });
        setShowForm(false);
        setFormData(INITIAL_LEAVE_FORM);

        const requester = employees.find((x) => x.id === targetEmpId) || myEmployee;
        const empName = requester ? `${requester.first_name} ${requester.last_name}` : "An employee";

        logActivity({
          module: "leave",
          action: "created",
          entityType: "leave_request",
          entityId: data?.id,
          actorName,
          actorRole,
          description: `Submitted ${formData.leave_type} leave request for ${days} days (${formData.start_date} to ${formData.end_date}) for ${empName}`,
        });

        notify({
          source: "leave",
          type: "info",
          title: "New Leave Request",
          message: `${empName} requested ${days} day(s) ${formData.leave_type} leave (${formData.start_date} to ${formData.end_date})`,
          entityId: data?.id,
        });

        await loadData();
      } catch (err: any) {
        console.error("Submit leave request error:", err);
        setToast({ type: "error", message: err.message || "Failed to submit request" });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, myEmployee, employees, requests, actorName, actorRole, getRemaining, loadData, setToast]
  );

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

      // Telegram notification
      notifyTelegramEvent({
        event: isApprove ? "leave_approved" : "leave_rejected",
        title: isApprove ? "✅ Leave Request Approved" : "❌ Leave Request Rejected",
        lines: [
          `<b>Employee:</b> ${escapeTelegramHtml(empName)}`,
          `<b>Type:</b> ${escapeTelegramHtml(LEAVE_TYPE_CONFIG[selectedRequest.leave_type]?.label || selectedRequest.leave_type)}`,
          `<b>Duration:</b> ${selectedRequest.days} day(s) (${selectedRequest.start_date} → ${selectedRequest.end_date})`,
          `<b>Decided By:</b> ${escapeTelegramHtml(actorName)}`,
          ...(approvalNote ? [`<b>Note:</b> ${escapeTelegramHtml(approvalNote)}`] : []),
        ],
        url: hrNexusUrl(`/leave?highlight=${selectedRequest.id}`),
      });

      await loadData();
    } catch (err: any) {
      console.error("Process approval error:", err);
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
        .update({
          status: "cancelled",
          reason: combinedReason,
        })
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
      console.error("Cancel leave request error:", err);
      setToast({ type: "error", message: err.message || "Failed to cancel request" });
    } finally {
      setProcessingCancel(false);
    }
  }, [cancelTargetRequest, cancelReason, actorName, actorRole, loadData, setToast]);

  return {
    showForm,
    setShowForm,
    formData,
    setFormData,
    submitting,
    handleSubmitRequest,
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
    inspectRequest,
    setInspectRequest,
  };
}
