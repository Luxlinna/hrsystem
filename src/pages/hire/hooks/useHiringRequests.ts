import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
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
  isBranchAdmin: _isBranchAdmin = false,
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

    setRequestForm({
      ...INITIAL_HIRING_REQUEST_FORM,
      company: "UNI",
      business_unit: resolvedBuName,
      branch_id: activeBranchId,
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
        const { reqCode, branchName } = await submitHiringRequest({
          requestForm,
          actorName,
          actorRole,
          actorEmail,
          myEmployeeId,
          userBranchId,
          userBranchName,
          branches,
        });

        toast("Request Submitted", `Requisition ${reqCode}submitted for ${branchName} leadership review.`, "success");
        setShowRequestModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit hiring request", "error");
      } finally {
        setSubmittingRequest(false);
      }
    },
    [requestForm, myEmployeeId, actorName, actorRole, actorEmail, loadData, branches, userBranchId, userBranchName]
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
        const { error } = await supabase.from("hiring_requests").delete().eq("id", id);
        if (error) throw error;
        toast("Deleted", "Hiring requisition deleted.", "info");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete request", "error");
      }
    },
    [hiringRequests, myEmployeeId, actorEmail, actorName, isSuperAdmin, isAdmin, loadData]
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

