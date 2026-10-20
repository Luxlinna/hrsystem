import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { notifyNewLeaveRequest } from "../services/leaveNotificationService";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import type { LeaveRequest, Employee, LeaveFormData } from "../types";
import { INITIAL_LEAVE_FORM } from "../constants";
import { calculateDays, rangesOverlap } from "../dateUtils";
import { getLeaveEmployeeName } from "../utils/leaveDisplayUtils";
import { getLeaveTypeSlug } from "../services/leaveSettingsService";
import { useLeaveApprovalDecision } from "./useLeaveApprovalDecision";

interface UseLeaveMutationsProps {
  requests: LeaveRequest[];
  employees: Employee[];
  myEmployee: Employee | null;
  actorName: string;
  actorRole: string;
  canApproveLeave?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  hasRoleApprovalAccess?: boolean;
  hasManagerEndorseAccess?: boolean;
  hasBuAdminEndorseAccess?: boolean;
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
  canApproveLeave,
  isAdmin,
  isSuperAdmin: isSuperAdminProp,
  isBranchAdmin,
  hasRoleApprovalAccess,
  hasManagerEndorseAccess,
  hasBuAdminEndorseAccess,
  getRemaining,
  loadData,
  setToast,
}: UseLeaveMutationsProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<LeaveFormData>(INITIAL_LEAVE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [inspectRequest, setInspectRequest] = useState<LeaveRequest | null>(null);

  const isSuperAdmin =
    isSuperAdminProp ||
    actorRole?.toLowerCase().includes("super admin") ||
    actorRole?.toLowerCase().includes("superadmin");

  const decision = useLeaveApprovalDecision({
    actorName,
    actorRole,
    myEmployeeId: myEmployee?.id,
    myDepartment: myEmployee?.department,
    canApproveLeave,
    isAdmin,
    isSuperAdmin,
    isBranchAdmin,
    hasRoleApprovalAccess,
    hasManagerEndorseAccess,
    hasBuAdminEndorseAccess,
    requests,
    loadData,
    setToast,
  });

  const handleSubmitRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const targetEmpId = formData.employee_id || myEmployee?.id;
      if (!targetEmpId) return setToast({ type: "error", message: "Please select an employee" });
      if (!formData.start_date || !formData.end_date) return setToast({ type: "error", message: "Please select start and end dates" });
      if (new Date(formData.end_date) < new Date(formData.start_date)) return setToast({ type: "error", message: "End date cannot be before start date" });
      const cleanReason = (formData.reason || "").trim();
      if (!cleanReason) return setToast({ type: "error", message: "Please provide a reason for this leave request." });

      const days = calculateDays(formData.start_date, formData.end_date);
      const slug = getLeaveTypeSlug(formData.leave_type);

      // Strict quota check ONLY applies to Annual Leave when remaining allowance is exceeded
      if (slug === "annual") {
        const remaining = getRemaining(targetEmpId, "annual");
        if (remaining !== null && days > remaining && !isSuperAdmin) {
          return setToast({
            type: "error",
            message: `Requested ${days} days exceeds remaining Annual Leave allowance (${remaining} days available).`,
          });
        }
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
        const filesToUpload: File[] =
          formData.attachment_files && formData.attachment_files.length > 0
            ? formData.attachment_files
            : formData.attachment_file
            ? [formData.attachment_file]
            : [];

        const uploadedUrls: string[] = [];
        if (formData.attachment_url) {
          uploadedUrls.push(formData.attachment_url);
        }
        if (formData.attachment_urls && formData.attachment_urls.length > 0) {
          for (const u of formData.attachment_urls) {
            if (u && !uploadedUrls.includes(u)) uploadedUrls.push(u);
          }
        }

        if (filesToUpload.length > 0) {
          try {
            const uploadResults = await Promise.allSettled(
              filesToUpload.map((file) => uploadMediaToS3(file, "leave/attachments"))
            );
            let failCount = 0;
            for (const res of uploadResults) {
              if (res.status === "fulfilled" && res.value?.url) {
                uploadedUrls.push(res.value.url);
              } else {
                failCount++;
                console.error("Leave attachment upload error:", res.status === "rejected" ? res.reason : "No URL");
              }
            }
            if (failCount > 0) {
              setToast({
                type: "info",
                message: `${failCount} attachment(s) failed to upload; continuing submission...`,
              });
            }
          } catch (uploadBatchErr) {
            console.error("Leave batch upload error:", uploadBatchErr);
          }
        }

        // Build composite reason with category, remark, and attachment links
        let fullReason = cleanReason;
        if (formData.category_law) fullReason = `[Category: ${formData.category_law}]\n${fullReason}`;
        if (formData.remark?.trim()) fullReason = `${fullReason}\n\n[Remark: ${formData.remark.trim()}]`;
        if (uploadedUrls.length > 0) {
          const attachmentLines = uploadedUrls.map((u) => `[Attachment: ${u}]`).join("\n");
          fullReason = `${fullReason}\n\n${attachmentLines}`;
        }

        const newStatus = isSuperAdmin ? "approved" : "pending";

        const { data, error } = await supabase
          .from("leave_requests")
          .insert([
            {
              employee_id: targetEmpId,
              leave_type: formData.leave_type,
              start_date: formData.start_date,
              end_date: formData.end_date,
              days,
              reason: fullReason,
              status: newStatus,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setToast({
          type: "success",
          message: isSuperAdmin
            ? "Leave recorded and automatically approved (Super Admin)"
            : "Leave request submitted successfully for approval",
        });
        setShowForm(false);
        setFormData(INITIAL_LEAVE_FORM);

        const requester = employees.find((x) => x.id === targetEmpId) || myEmployee;
        const empName = requester ? getLeaveEmployeeName(requester) : "An employee";

        logActivity({
          module: "leave",
          action: isSuperAdmin ? "approved" : "created",
          entityType: "leave_request",
          entityId: data?.id,
          actorName,
          actorRole,
          description: `${isSuperAdmin ? "Created & Auto-Approved" : "Submitted"} ${formData.leave_type} leave request for ${days} days (${formData.start_date} to ${formData.end_date}) for ${empName}`,
        });

        const roleLower = requester?.role?.toLowerCase() || "";
        const isApplicantDirectHr = Boolean(
          isSuperAdmin || roleLower.includes("super admin") || roleLower.includes("branch admin") || roleLower.includes("bu admin") || roleLower.includes("be admin")
        );

        try {
          await notifyNewLeaveRequest({
            request: {
              id: data?.id,
              leave_type: formData.leave_type,
              days,
              start_date: formData.start_date,
              end_date: formData.end_date,
              reason: fullReason,
            },
            requester,
            actorName,
            isDirectHr: isApplicantDirectHr,
          });
        } catch (notifyErr) {
          console.warn("Notification error after leave creation:", notifyErr);
        }

        await loadData();
      } catch (err: any) {
        setToast({ type: "error", message: err.message || "Failed to submit request" });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, myEmployee, employees, requests, actorName, actorRole, isSuperAdmin, getRemaining, loadData, setToast]
  );

  return {
    showForm, setShowForm, formData, setFormData, submitting,
    handleSubmitRequest, ...decision, inspectRequest, setInspectRequest,
  };
}
