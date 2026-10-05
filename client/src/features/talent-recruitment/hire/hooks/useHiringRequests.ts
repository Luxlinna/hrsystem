import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { HiringRequest, NewHiringRequestFormState, Branch } from "../types";
import { INITIAL_HIRING_REQUEST_FORM } from "../constants";
import { useHiringRequestDecision } from "./useHiringRequestDecision";
import { submitHiringRequest } from "./hiringRequestCreation";

interface UseHiringRequestsProps {
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  myEmployeeId?: string;
  userBranchId?: string | null;
  userBranchName?: string | null;
  targetBranch?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  canBranchApprove?: boolean;
  canChairmanApprove?: boolean;
  canRequest?: boolean;
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
  targetBranch,
  isAdmin = false,
  isSuperAdmin = false,
  isBranchAdmin = false,
  canBranchApprove = false,
  canChairmanApprove = false,
  canRequest = true,
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
    if (!canRequest) {
      toast("Access Restricted", "Only Business Unit Managers and Authorized Leadership can submit hiring requisitions.", "warning");
      return;
    }

    const activeBranchId = defaultBranchId || targetBranch || userBranchId || "";
    const matchedBranch = branches.find((b) => b.id === activeBranchId);
    const resolvedBuName = matchedBranch?.name || userBranchName || "";

    let savedDraft: Partial<NewHiringRequestFormState> = {};
    try {
      const stored = localStorage.getItem("hr_hiring_request_draft");
      if (stored) savedDraft = JSON.parse(stored) || {};
    } catch (err) {
      console.warn("Could not parse draft:", err);
    }

    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      company: "UNI",
      business_unit: resolvedBuName,
      branch_id: activeBranchId,
      ...savedDraft,
    });
    setShowRequestModal(true);
  }, [canRequest, branches, targetBranch, userBranchId, userBranchName]);

  const handleCreateRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canRequest) {
        toast("Access Restricted", "Only Business Unit Managers and Authorized Leadership can submit hiring requisitions.", "warning");
        return;
      }
      if (!requestForm.title.trim() || !requestForm.department.trim()) {
        toast("Validation", "Please provide a job title and department.", "error");
        return;
      }

      setSubmittingRequest(true);
      try {
        const { reqCode, branchName, isBuCeoAdmin } = await submitHiringRequest({
          requestForm,
          actorName,
          actorRole,
          actorEmail,
          myEmployeeId,
          userBranchId,
          userBranchName,
          branches,
          isBranchAdmin,
          canBranchApprove,
        });

        const msg = isBuCeoAdmin
          ? `Requisition ${reqCode} endorsed by BU CEO and forwarded to HR Division.`
          : `Requisition ${reqCode} submitted for ${branchName} leadership review.`;
        toast("Request Submitted", msg, "success");
        setShowRequestModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit hiring request", "error");
      } finally {
        setSubmittingRequest(false);
      }
    },
    [canRequest, requestForm, myEmployeeId, actorName, actorRole, actorEmail, loadData, branches, userBranchId, userBranchName, isBranchAdmin, canBranchApprove]
  );

  const handleDeleteRequest = useCallback(
    async (id: string) => {
      const target = hiringRequests.find((r) => r.id === id);
      const isOwner = Boolean(
        (myEmployeeId && target?.requested_by_id === myEmployeeId) ||
        (actorEmail && target?.requested_by_email?.toLowerCase() === actorEmail.toLowerCase()) ||
        (actorName && target?.requested_by_name?.toLowerCase() === actorName.toLowerCase())
      );

      const canDelete = isOwner || isSuperAdmin || isAdmin;

      if (!canDelete) {
        toast("Permission Denied", "Only the requester, Admin, or Super Admin can delete this hiring requisition.", "error");
        return;
      }

      const reqTitle = target?.requisition_id ? `${target.requisition_id} (${target.title || "Requisition"})` : target?.title || "this hiring requisition";
      if (!confirm(`Are you sure you want to delete ${reqTitle}?\n\nThis will also automatically remove any opening job and associated approvals linked to this requisition.`)) return;

      try {
        const nowIso = new Date().toISOString();
        const linkedJobId = target?.job_posting_id;

        // 1. Find all candidates linked to this requisition or its opening job
        let candidateQuery = supabase.from("candidates").select("id").is("deleted_at", null);
        if (linkedJobId) {
          candidateQuery = candidateQuery.or(`job_posting_id.eq.${linkedJobId},hiring_request_id.eq.${id}`);
        } else {
          candidateQuery = candidateQuery.eq("hiring_request_id", id);
        }
        const { data: linkedCandidates } = await candidateQuery;
        const candIds = (linkedCandidates || []).map((c: any) => c.id).filter(Boolean);

        // 2. Cascade delete candidate approvals, interviews, contracts, offers & candidates
        if (candIds.length > 0) {
          await supabase.from("candidate_approvals").delete().in("candidate_id", candIds);

          try {
            const raw = localStorage.getItem("hrm_candidate_approvals_store");
            if (raw) {
              const list = JSON.parse(raw);
              const remaining = list.filter((a: any) => !candIds.includes(a.candidate_id));
              localStorage.setItem("hrm_candidate_approvals_store", JSON.stringify(remaining));
            }
          } catch {
            // Ignore localStorage errors
          }

          await supabase.from("interviews").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidate_contracts").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidate_offers").update({ deleted_at: nowIso }).in("candidate_id", candIds);
          await supabase.from("candidates").update({ deleted_at: nowIso }).in("id", candIds);
        }

        // 3. Auto-delete / close linked opening job
        if (linkedJobId) {
          const { error: jobErr } = await supabase.from("job_postings").update({
            deleted_at: nowIso,
            status: "closed",
          }).eq("id", linkedJobId);
          if (jobErr) {
            await supabase.from("job_postings").delete().eq("id", linkedJobId);
          }
        }

        // Also check if any job_postings has hiring_request_id = id
        await supabase.from("job_postings").update({
          deleted_at: nowIso,
          status: "closed",
        }).eq("hiring_request_id", id);

        // 4. Clean up approval requests and notifications for this requisition
        await supabase.from("approval_requests").delete().eq("entity_id", id);
        await supabase.from("notifications").delete().or(`hiring_request_id.eq.${id},reference_id.eq.${id}`);

        // 5. Delete the hiring requisition itself
        const { error } = await supabase.from("hiring_requests").update({
          deleted_at: nowIso,
          deleted_by: actorName || actorEmail || "Unknown",
          status: "cancelled",
        }).eq("id", id);

        if (error) {
          const delRes = await supabase.from("hiring_requests").delete().eq("id", id);
          if (delRes.error) throw delRes.error;
        }

        setHiringRequests((prev) => prev.filter((r) => r.id !== id));
        toast("Deleted", "Hiring requisition, opening job, and associated approvals have been deleted.", "info");

        logActivity({
          module: "hire",
          action: "deleted",
          entityType: "hiring_request",
          entityId: id,
          actorName: actorName || "User",
          actorRole: actorRole || "Unknown",
          description: `Deleted hiring requisition ${target?.requisition_id || id} (${target?.title || "Role"}) and associated opening job & approvals`,
        });

        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete request", "error");
      }
    },
    [hiringRequests, myEmployeeId, actorEmail, actorName, actorRole, isSuperAdmin, isAdmin, loadData, setHiringRequests]
  );

  return {
    showRequestModal,
    setShowRequestModal,
    requestForm,
    setRequestForm,
    submittingRequest,
    hiringRequests,
    setHiringRequests,
    openCreateRequest,
    handleCreateRequest,
    handleDeleteRequest,
    ...decision,
  };
}

