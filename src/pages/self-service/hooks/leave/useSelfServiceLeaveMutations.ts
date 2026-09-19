import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { INITIAL_LEAVE_FORM } from "@/pages/leave/constants";
import { calculateDays, rangesOverlap } from "@/pages/leave/dateUtils";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { logActivity } from "@/lib/audit";
import { notifyNewLeaveRequest } from "@/pages/leave/services/leaveNotificationService";
import type {
  Employee,
  LeaveFormData,
  LeaveRequest,
  LeaveTypeBalanceStats,
} from "@/pages/leave/types";

interface UseSelfServiceLeaveMutationsProps {
  employeeId: string;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  getLeaveTypeStats: (empId: string, type: string) => LeaveTypeBalanceStats;
  requests: LeaveRequest[];
  currentEmployee: Employee | null;
  fetchLeave: () => Promise<void>;
  showToast: (type: "success" | "error" | "info", message: string) => void;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
}

export function useSelfServiceLeaveMutations({
  employeeId,
  formData,
  setFormData,
  getLeaveTypeStats,
  requests,
  currentEmployee,
  fetchLeave,
  showToast,
  isSuperAdmin = false,
  isBranchAdmin = false,
}: UseSelfServiceLeaveMutationsProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, onSuccess: () => void) => {
      e.preventDefault();
      if (!formData.start_date || !formData.end_date) {
        showToast("error", "Please select start and end dates.");
        return;
      }
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        showToast("error", "End date must be on or after start date.");
        return;
      }
      const cleanReason = (formData.reason || "").trim();
      if (!cleanReason || cleanReason.length < 5) {
        showToast("error", "Please provide a reason for taking leave.");
        return;
      }

      const days = calculateDays(formData.start_date, formData.end_date);
      const stats = getLeaveTypeStats(employeeId, formData.leave_type);
      if (stats.balance > 0 && days > stats.available) {
        showToast(
          "error",
          `Requested ${days} days exceeds remaining allowance (${stats.available} days available).`
        );
        return;
      }

      const conflict = requests.find(
        (r) =>
          (r.status === "pending" || r.status === "approved") &&
          rangesOverlap(formData.start_date, formData.end_date, r.start_date, r.end_date)
      );
      if (conflict) {
        showToast(
          "error",
          `Dates overlap an existing ${conflict.status} request (${conflict.start_date} → ${conflict.end_date}).`
        );
        return;
      }

      setSubmitting(true);
      try {
        let uploadedUrl = formData.attachment_url || null;
        if (formData.attachment_file) {
          try {
            const media = await uploadMediaToS3(formData.attachment_file, "leave/attachments");
            uploadedUrl = media.url;
          } catch (uploadErr) {
            console.error("Leave attachment upload error:", uploadErr);
          }
        }

        let fullReason = cleanReason;
        if (formData.category_law) {
          fullReason = `[Category: ${formData.category_law}]\n${fullReason}`;
        }
        if (formData.remark?.trim()) {
          fullReason = `${fullReason}\n\n[Remark: ${formData.remark.trim()}]`;
        }
        if (uploadedUrl) {
          fullReason = `${fullReason}\n\n[Attachment: ${uploadedUrl}]`;
        }

        const { data: newRow, error } = await supabase
          .from("leave_requests")
          .insert([
            {
              employee_id: employeeId,
              leave_type: formData.leave_type,
              start_date: formData.start_date,
              end_date: formData.end_date,
              days,
              reason: fullReason,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        const actorName = currentEmployee
          ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
          : "Employee";

        logActivity({
          actorId: employeeId,
          actorName,
          action: "create",
          targetType: "leave_request",
          targetId: newRow?.id,
          details: `Self-requested ${formData.leave_type} leave (${days} days) from ${formData.start_date} to ${formData.end_date}`,
        });

        const roleLower = currentEmployee?.role?.toLowerCase() || "";
        const isDirectHr = Boolean(
          isSuperAdmin ||
          isBranchAdmin ||
          roleLower.includes("super admin") ||
          roleLower.includes("superadmin") ||
          roleLower.includes("branch admin") ||
          roleLower.includes("bu admin") ||
          roleLower.includes("be admin")
        );

        await notifyNewLeaveRequest({
          request: newRow,
          requester: currentEmployee,
          actorName,
          isDirectHr,
        });

        showToast("success", "Leave request submitted successfully!");
        setFormData({ ...INITIAL_LEAVE_FORM, employee_id: employeeId });
        onSuccess();
        fetchLeave();
      } catch (err: any) {
        console.error("Error submitting leave request:", err);
        showToast("error", err?.message || "Failed to submit leave request.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      employeeId,
      formData,
      setFormData,
      getLeaveTypeStats,
      requests,
      currentEmployee,
      fetchLeave,
      showToast,
      isSuperAdmin,
      isBranchAdmin,
    ]
  );

  return {
    submitting,
    handleSubmit,
  };
}
