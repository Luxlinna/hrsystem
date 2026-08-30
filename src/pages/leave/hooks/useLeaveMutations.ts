import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { LeaveRequest, Employee, LeaveFormData } from "../types";
import { INITIAL_LEAVE_FORM } from "../constants";
import { calculateDays, rangesOverlap } from "../dateUtils";
import { useLeaveApprovalDecision } from "./useLeaveApprovalDecision";

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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<LeaveFormData>(INITIAL_LEAVE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [inspectRequest, setInspectRequest] = useState<LeaveRequest | null>(null);

  const decision = useLeaveApprovalDecision({
    actorName,
    actorRole,
    loadData,
    setToast,
  });

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
        setToast({ type: "error", message: err.message || "Failed to submit request" });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, myEmployee, employees, requests, actorName, actorRole, getRemaining, loadData, setToast]
  );

  return {
    showForm,
    setShowForm,
    formData,
    setFormData,
    submitting,
    handleSubmitRequest,
    selectedRequest: decision.selectedRequest,
    setSelectedRequest: decision.setSelectedRequest,
    approvalNote: decision.approvalNote,
    setApprovalNote: decision.setApprovalNote,
    showApprovalModal: decision.showApprovalModal,
    setShowApprovalModal: decision.setShowApprovalModal,
    approvalAction: decision.approvalAction,
    setApprovalAction: decision.setApprovalAction,
    processingApproval: decision.processingApproval,
    handleProcessApproval: decision.handleProcessApproval,
    cancelTargetRequest: decision.cancelTargetRequest,
    setCancelTargetRequest: decision.setCancelTargetRequest,
    cancelReason: decision.cancelReason,
    setCancelReason: decision.setCancelReason,
    showCancelModal: decision.showCancelModal,
    setShowCancelModal: decision.setShowCancelModal,
    processingCancel: decision.processingCancel,
    handleCancelRequest: decision.handleCancelRequest,
    inspectRequest,
    setInspectRequest,
  };
}
