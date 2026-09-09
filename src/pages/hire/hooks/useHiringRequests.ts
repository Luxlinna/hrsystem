import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { HiringRequest, NewHiringRequestFormState, Branch } from "../types";
import { INITIAL_HIRING_REQUEST_FORM } from "../constants";
import { useHiringRequestDecision } from "./useHiringRequestDecision";

interface UseHiringRequestsProps {
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  myEmployeeId?: string;
  userBranchId?: string | null;
  userBranchName?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  canChairmanApprove?: boolean;
  loadData: () => Promise<void>;
  branches?: Branch[];
}

export function useHiringRequests({
  actorName,
  actorRole,
  actorEmail,
  myEmployeeId,
  userBranchId,
  userBranchName,
  isAdmin = false,
  isSuperAdmin = false,
  isBranchAdmin: _isBranchAdmin = false,
  canChairmanApprove = false,
  loadData,
  branches = [],
}: UseHiringRequestsProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<NewHiringRequestFormState>(INITIAL_HIRING_REQUEST_FORM);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);

  const decision = useHiringRequestDecision({
    actorName,
    actorRole,
    userBranchName: userBranchName || undefined,
    loadData,
    canChairmanApprove,
    isSuperAdmin,
  });

  const openCreateRequest = useCallback((defaultBranchId?: string) => {
    const targetBranchId = defaultBranchId || userBranchId || "";
    const matchedBranch = branches.find((b) => b.id === targetBranchId);
    const resolvedBuName = userBranchName || matchedBranch?.name || "";

    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      company: "UNI",
      business_unit: resolvedBuName,
      branch_id: targetBranchId,
    });
    setShowRequestModal(true);
  }, [branches, userBranchId, userBranchName]);

  const handleCreateRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!requestForm.title.trim() || !requestForm.department.trim()) {
        toast("Validation", "Please provide a job title and department.", "error");
        return;
      }

      setSubmittingRequest(true);
      try {
        const selectedBranchObj = branches.find((b) => b.id === requestForm.branch_id);
        const resolvedBranchId = selectedBranchObj?.is_site
          ? (selectedBranchObj.branch_id || null)
          : (requestForm.branch_id || userBranchId || null);

        const payload = {
          title: requestForm.title.trim(),
          department: requestForm.department.trim(),
          division: requestForm.division?.trim() || null,
          company: requestForm.company?.trim() || "UNI",
          business_unit: requestForm.business_unit?.trim() || userBranchName || selectedBranchObj?.name || null,
          branch_id: resolvedBranchId,
          position_type: requestForm.position_type || "new",
          replacement_for_id: requestForm.position_type === "replacement" ? (requestForm.replacement_for_id || null) : null,
          replacement_for_name: requestForm.position_type === "replacement" ? (requestForm.replacement_for_name || null) : null,
          location: requestForm.location?.trim() || null,
          target_joining_date: requestForm.target_joining_date || null,
          job_description: requestForm.job_description?.trim() || null,
          hiring_manager_id: requestForm.hiring_manager_id || null,
          hiring_manager_name: requestForm.hiring_manager_name?.trim() || null,
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

        const { data, error } = await supabase.from("hiring_requests").insert([payload]).select("*, branches(name)").single();
        if (error) throw error;

        const branchName = data?.branches?.name || selectedBranchObj?.name || "Headquarters";
        const reqCode = data?.requisition_id ? `[${data.requisition_id}] ` : "";

        toast("Request Submitted", `Requisition ${reqCode}submitted for ${branchName} leadership review.`, "success");
        setShowRequestModal(false);

        // 1. In-app notification to Branch Admin / Leadership in their own branch
        await notify({
          title: `📋 New Requisition: ${reqCode}${payload.title}`,
          message: `${actorName} requested ${payload.headcount} headcount in ${payload.department} (${branchName}). Awaiting branch endorsement.`,
          type: "info",
          source: "hire",
          entityId: data?.id,
          branch_id: resolvedBranchId,
        });

        // 2. Audit log
        logActivity({
          module: "hire",
          action: "created",
          entityType: "hiring_request",
          entityId: data?.id,
          actorName,
          actorRole,
          description: `Hiring requisition submitted: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${branchName}`,
        });

        // 3. Telegram notification
        notifyTelegramEvent(
          `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
          `🏷️ <b>Type:</b> ${payload.position_type === "replacement" ? `Replacement (for ${escapeTelegramHtml(payload.replacement_for_name || "Outgoing Staff")})` : "New Position"}\n` +
          `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}${payload.division ? ` · ${escapeTelegramHtml(payload.division)}` : ""}\n` +
          `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || branchName)}\n` +
          `👤 <b>Requester:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
          (payload.hiring_manager_name ? `👔 <b>Hiring Manager:</b> ${escapeTelegramHtml(payload.hiring_manager_name)}\n` : "") +
          (payload.target_joining_date ? `📅 <b>Target Joining Date:</b> ${escapeTelegramHtml(payload.target_joining_date)}\n` : "") +
          `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
          `🎯 <b>Next Action:</b> CEO / Director Endorsement\n` +
          `ℹ️ <b>Status:</b> Round 1 — Awaiting Endorsement`,
          { text: "Review Requisition", url: hrNexusUrl("/hire") }
        );

        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit hiring request", "error");
      } finally {
        setSubmittingRequest(false);
      }
    },
    [requestForm, myEmployeeId, actorName, actorRole, actorEmail, loadData, branches]
  );

  const handleDeleteRequest = useCallback(
    async (id: string) => {
      const target = hiringRequests.find((r) => r.id === id);
      const isOwner =
        (myEmployeeId && target?.requested_by_id === myEmployeeId) ||
        (actorEmail && target?.requested_by_email?.toLowerCase() === actorEmail.toLowerCase()) ||
        (actorName && target?.requested_by_name?.toLowerCase() === actorName.toLowerCase());

      if (target && !isOwner && !isSuperAdmin && !isAdmin) {
        toast("Permission Denied", "You can only delete requisitions that you created.", "error");
        return;
      }

      if (!confirm("Are you sure you want to delete this hiring requisition?")) return;
      try {
        const { error } = await supabase
          .from("hiring_requests")
          .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
          .eq("id", id);
        if (error) throw error;
        toast("Deleted", "Hiring requisition deleted.", "success");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete hiring requisition", "error");
      }
    },
    [actorName, actorEmail, myEmployeeId, isSuperAdmin, isAdmin, hiringRequests, loadData]
  );

  return {
    hiringRequests,
    setHiringRequests,
    showRequestModal,
    setShowRequestModal,
    requestForm,
    setRequestForm,
    submittingRequest,
    decisionModal: decision.decisionModal,
    setDecisionModal: decision.setDecisionModal,
    targetRequest: decision.targetRequest,
    decisionAction: decision.decisionAction,
    rejectionReason: decision.rejectionReason,
    setRejectionReason: decision.setRejectionReason,
    processingDecision: decision.processingDecision,
    openCreateRequest,
    openDecisionModal: decision.openDecisionModal,
    handleCreateRequest,
    handleDeleteRequest,
    handleDecision: decision.handleDecision,
    handleAssignHrOfficer: decision.handleAssignHrOfficer,
  };
}
