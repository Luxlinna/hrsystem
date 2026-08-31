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
  userBranchName?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  loadData: () => Promise<void>;
  branches?: Branch[];
}

export function useHiringRequests({
  actorName,
  actorRole,
  actorEmail,
  myEmployeeId,
  userBranchName,
  isAdmin = false,
  isSuperAdmin = false,
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
  });

  const openCreateRequest = useCallback((defaultBranchId?: string) => {
    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      branch_id: defaultBranchId || "",
    });
    setShowRequestModal(true);
  }, []);

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
          : (requestForm.branch_id || null);

        const payload = {
          title: requestForm.title.trim(),
          department: requestForm.department.trim(),
          branch_id: resolvedBranchId,
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

        toast("Request Submitted", `Hiring request submitted for ${branchName} leadership review.`, "success");
        setShowRequestModal(false);

        // 1. In-app notification to Branch Admin / Leadership in their own branch
        await notify({
          title: `📋 New Requisition: ${payload.title}`,
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
          description: `Hiring requisition submitted: ${payload.headcount}x ${payload.title} (${payload.department}) for ${branchName}`,
        });

        // 3. Telegram notification targeting Branch Approvers first
        notifyTelegramEvent(
          `📋 <b>New Hiring Requisition Submitted</b>\n` +
          `👤 <b>Requester (Manager):</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
          `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
          `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
          `📍 <b>Branch:</b> ${escapeTelegramHtml(branchName)}\n` +
          `⚡ <b>Urgency:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
          `🎯 <b>Action Required By:</b> Branch Admin / Branch Leadership (${escapeTelegramHtml(branchName)})\n` +
          `ℹ️ <b>Status:</b> Round 1 — Awaiting Branch Endorsement`,
          { text: "Review in Branch", url: hrNexusUrl("/hire") }
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
