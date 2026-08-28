import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { HiringRequest, NewHiringRequestFormState } from "../types";
import { INITIAL_HIRING_REQUEST_FORM } from "../constants";

interface UseHiringRequestsProps {
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  myEmployeeId?: string;
  loadData: () => Promise<void>;
}

export function useHiringRequests({
  actorName,
  actorRole,
  actorEmail,
  myEmployeeId,
  loadData,
}: UseHiringRequestsProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<NewHiringRequestFormState>(INITIAL_HIRING_REQUEST_FORM);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Decision Modal (Approval / Rejection by CEO)
  const [decisionModal, setDecisionModal] = useState(false);
  const [targetRequest, setTargetRequest] = useState<HiringRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);

  const openCreateRequest = useCallback((defaultBranchId?: string) => {
    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      branch_id: defaultBranchId || "",
    });
    setShowRequestModal(true);
  }, []);

  const openDecisionModal = useCallback((req: HiringRequest, action: "approved" | "rejected") => {
    setTargetRequest(req);
    setDecisionAction(action);
    setRejectionReason("");
    setDecisionModal(true);
  }, []);

  const handleCreateRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.title.trim() || !requestForm.department.trim()) {
      toast("Validation", "Please provide a job title and department.", "error");
      return;
    }

    setSubmittingRequest(true);
    try {
      const payload = {
        title: requestForm.title.trim(),
        department: requestForm.department.trim(),
        branch_id: requestForm.branch_id || null,
        requested_by_id: myEmployeeId || null,
        requested_by_name: actorName,
        requested_by_email: actorEmail || null,
        headcount: Number(requestForm.headcount) || 1,
        employment_type: requestForm.employment_type,
        salary_min: Number(requestForm.salary_min) || null,
        salary_max: Number(requestForm.salary_max) || null,
        justification: requestForm.justification.trim() || null,
        urgency: requestForm.urgency,
        status: "pending",
      };

      const { data, error } = await supabase
        .from("hiring_requests")
        .insert([payload])
        .select("*, branches(name)")
        .single();

      if (error) throw error;

      toast("Request Submitted", "Hiring request submitted for CEO review.", "success");
      setShowRequestModal(false);

      logActivity({
        module: "hire",
        action: "created",
        entityType: "hiring_request",
        entityId: data?.id,
        actorName,
        actorRole,
        description: `Hiring requisition submitted: ${payload.headcount}x ${payload.title} (${payload.department})`,
      });

      notify({
        source: "hire",
        type: "info",
        title: "New Hiring Request Submitted",
        message: `${actorName} requested ${payload.headcount}x ${payload.title} for ${payload.department}. Pending CEO decision.`,
        entityId: data?.id,
      });

      notifyTelegramEvent(
        `📋 <b>New Hiring Requisition Submitted</b>\n` +
        `👤 <b>Requester (Manager):</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
        `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
        `⚡ <b>Urgency:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
        `ℹ️ <b>Status:</b> Awaiting CEO Acceptance`,
        { text: "Review Requisition", url: hrNexusUrl("/hire") }
      );

      await loadData();
    } catch (err: any) {
      console.error("Failed to create hiring request:", err);
      toast("Error", err.message || "Failed to submit hiring request", "error");
    } finally {
      setSubmittingRequest(false);
    }
  }, [requestForm, myEmployeeId, actorName, actorRole, actorEmail, loadData]);

  const handleDecision = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRequest) return;

    if (decisionAction === "rejected" && !rejectionReason.trim()) {
      toast("Validation", "Please specify a reason for rejection.", "error");
      return;
    }

    setProcessingDecision(true);
    try {
      if (decisionAction === "approved") {
        // 1. Create live job posting automatically
        const { data: jobData, error: jobErr } = await supabase
          .from("job_postings")
          .insert([
            {
              title: targetRequest.title,
              department: targetRequest.department,
              branch_id: targetRequest.branch_id,
              description: targetRequest.justification || `Position: ${targetRequest.title} in ${targetRequest.department}`,
              salary_min: targetRequest.salary_min || 0,
              salary_max: targetRequest.salary_max || 0,
              type: targetRequest.employment_type,
              status: "active",
              location: "On-site",
              requirements: [],
            },
          ])
          .select("id")
          .single();

        if (jobErr) throw jobErr;

        // 2. Update requisition status
        const { error: reqErr } = await supabase
          .from("hiring_requests")
          .update({
            status: "approved",
            reviewed_by: actorName,
            reviewed_at: new Date().toISOString(),
            job_posting_id: jobData?.id || null,
          })
          .eq("id", targetRequest.id);

        if (reqErr) throw reqErr;

        toast("Request Approved", `Hiring request approved by CEO and Job Posting created.`, "success");

        logActivity({
          module: "hire",
          action: "approved",
          entityType: "hiring_request",
          entityId: targetRequest.id,
          actorName,
          actorRole,
          description: `CEO approved hiring request: ${targetRequest.title} (${targetRequest.department})`,
        });

        notify({
          source: "hire",
          type: "success",
          title: "Hiring Request Approved",
          message: `CEO approved hiring request for ${targetRequest.title}. Job posting is now active.`,
          entityId: targetRequest.id,
        });

        // Report to Chairman and team
        notifyTelegramEvent(
          `✅ <b>Hiring Requisition Approved by CEO</b>\n` +
          `👤 <b>Approved by:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
          `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
          `📢 <b>Report to Chairman/Chairwoman:</b> Headcount expansion authorized.`,
          { text: "View Live Posting", url: hrNexusUrl("/hire") }
        );
      } else {
        // Rejection
        const { error: reqErr } = await supabase
          .from("hiring_requests")
          .update({
            status: "rejected",
            reviewed_by: actorName,
            reviewed_at: new Date().toISOString(),
            rejection_reason: rejectionReason.trim(),
          })
          .eq("id", targetRequest.id);

        if (reqErr) throw reqErr;

        toast("Request Rejected", "Hiring request has been rejected.", "info");

        logActivity({
          module: "hire",
          action: "rejected",
          entityType: "hiring_request",
          entityId: targetRequest.id,
          actorName,
          actorRole,
          description: `CEO rejected hiring request: ${targetRequest.title}. Reason: ${rejectionReason}`,
        });

        notify({
          source: "hire",
          type: "warning",
          title: "Hiring Request Rejected",
          message: `Hiring request for ${targetRequest.title} was rejected by CEO: ${rejectionReason}`,
          entityId: targetRequest.id,
        });

        // Report to Chairman and Requester
        notifyTelegramEvent(
          `❌ <b>Hiring Requisition Rejected by CEO</b>\n` +
          `👤 <b>Decided by:</b> ${escapeTelegramHtml(actorName)}\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
          `📝 <b>Reason:</b> ${escapeTelegramHtml(rejectionReason.trim())}\n` +
          `📢 <b>Report to Chairman/Chairwoman:</b> Requisition declined.`
        );
      }

      setDecisionModal(false);
      setTargetRequest(null);
      await loadData();
    } catch (err: any) {
      console.error("Failed to process decision:", err);
      toast("Error", err.message || "Failed to process decision", "error");
    } finally {
      setProcessingDecision(false);
    }
  }, [targetRequest, decisionAction, rejectionReason, actorName, actorRole, loadData]);

  return {
    showRequestModal,
    setShowRequestModal,
    requestForm,
    setRequestForm,
    submittingRequest,
    decisionModal,
    setDecisionModal,
    targetRequest,
    decisionAction,
    rejectionReason,
    setRejectionReason,
    processingDecision,
    openCreateRequest,
    openDecisionModal,
    handleCreateRequest,
    handleDecision,
  };
}
