import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { HiringRequest } from "../types";
import { executeApprovalStep, executeRejectionStep } from "./hiringDecisionExecutors";

interface UseHiringRequestDecisionProps {
  actorName: string;
  actorRole: string;
  userBranchName?: string;
  loadData: () => Promise<void>;
  canChairmanApprove?: boolean;
  isSuperAdmin?: boolean;
}

export function useHiringRequestDecision({
  actorName,
  actorRole,
  userBranchName,
  loadData,
  canChairmanApprove = false,
  isSuperAdmin = false,
}: UseHiringRequestDecisionProps) {
  const [decisionModal, setDecisionModal] = useState(false);
  const [targetRequest, setTargetRequest] = useState<HiringRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);

  const openDecisionModal = useCallback((req: HiringRequest, action: "approved" | "rejected") => {
    setTargetRequest(req);
    setDecisionAction(action);
    setRejectionReason("");
    setDecisionModal(true);
  }, []);

  const handleAssignHrOfficer = useCallback(
    async (requestId: string, hrId: string | null, hrName: string | null) => {
      try {
        const { error } = await supabase
          .from("hiring_requests")
          .update({
            hr_assigned_to_id: hrId,
            hr_assigned_to_name: hrName,
            assigned_recruiter_id: hrId,
            assigned_recruiter_name: hrName,
          })
          .eq("id", requestId);
        if (error) throw error;
        toast("Recruiter Updated", hrName ? `Assigned to ${hrName}.` : "Recruiter unassigned.", "success");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to update recruiter assignment", "error");
      }
    },
    [loadData]
  );

  const handleDecision = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetRequest) return;

      const isChairmanOrSuper =
        canChairmanApprove ||
        isSuperAdmin ||
        /chair|ceo|president|board/i.test(actorRole || "") ||
        /super\s*admin/i.test(actorRole || "");

      if (decisionAction === "rejected" && !rejectionReason.trim()) {
        toast("Validation", "Please specify a reason for rejection.", "error");
        return;
      }

      setProcessingDecision(true);
      try {
        const ctx = {
          targetRequest,
          actorName,
          actorRole,
          userBranchName,
          isChairmanOrSuper,
        };

        if (decisionAction === "approved") {
          const result = await executeApprovalStep(ctx);
          toast(result.title, result.message, "success");
        } else {
          const result = await executeRejectionStep(ctx, rejectionReason);
          toast(result.title, result.message, "info");
        }

        setDecisionModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to process requisition decision", "error");
      } finally {
        setProcessingDecision(false);
      }
    },
    [targetRequest, decisionAction, rejectionReason, actorName, actorRole, userBranchName, loadData, canChairmanApprove, isSuperAdmin]
  );

  return {
    decisionModal,
    setDecisionModal,
    targetRequest,
    decisionAction,
    rejectionReason,
    setRejectionReason,
    processingDecision,
    openDecisionModal,
    handleDecision,
    handleAssignHrOfficer,
  };
}
