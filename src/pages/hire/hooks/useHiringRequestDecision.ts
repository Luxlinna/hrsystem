import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { HiringRequest } from "../types";

interface UseHiringRequestDecisionProps {
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
}

export function useHiringRequestDecision({
  actorName,
  actorRole,
  loadData,
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

  const handleDecision = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!targetRequest) return;

      if (decisionAction === "rejected" && !rejectionReason.trim()) {
        toast("Validation", "Please specify a reason for rejection.", "error");
        return;
      }

      setProcessingDecision(true);
      try {
        if (decisionAction === "approved") {
          const { data: jobData, error: jobErr } = await supabase
            .from("job_postings")
            .insert([
              {
                title: targetRequest.title,
                department: targetRequest.department,
                branch_id: targetRequest.branch_id,
                type: targetRequest.employment_type || "full-time",
                salary_min: targetRequest.salary_min,
                salary_max: targetRequest.salary_max,
                description: targetRequest.justification
                  ? `Approved Requisition: ${targetRequest.justification}`
                  : null,
                status: "open",
                posted_by: actorName,
              },
            ])
            .select()
            .single();

          if (jobErr) throw jobErr;

          const { error: reqErr } = await supabase
            .from("hiring_requests")
            .update({
              status: "approved",
              reviewed_by: actorName,
              reviewed_at: new Date().toISOString(),
              job_posting_id: jobData?.id,
            })
            .eq("id", targetRequest.id);

          if (reqErr) throw reqErr;

          toast("Requisition Approved", "Approved and created live job posting.", "success");

          notifyTelegramEvent(
            `✅ <b>Hiring Requisition Approved by CEO</b>\n` +
            `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
            `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
            `👤 <b>Reviewed By (CEO):</b> ${escapeTelegramHtml(actorName)}\n` +
            `📢 <b>Action:</b> Live Job Opening published on recruitment portal.`,
            { text: "View Live Job", url: hrNexusUrl("/hire") }
          );
        } else {
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

          toast("Requisition Rejected", "Decision recorded and manager notified.", "info");

          notifyTelegramEvent(
            `❌ <b>Hiring Requisition Rejected by CEO</b>\n` +
            `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
            `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
            `👤 <b>Reviewed By:</b> ${escapeTelegramHtml(actorName)}\n` +
            `📝 <b>Reason:</b> ${escapeTelegramHtml(rejectionReason.trim())}`,
            { text: "View Requisitions", url: hrNexusUrl("/hire") }
          );
        }

        setDecisionModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to process requisition decision", "error");
      } finally {
        setProcessingDecision(false);
      }
    },
    [targetRequest, decisionAction, rejectionReason, actorName, loadData]
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
  };
}
