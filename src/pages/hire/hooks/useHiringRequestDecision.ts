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

  const handleAssignHrOfficer = useCallback(
    async (requestId: string, hrId: string | null, hrName: string | null) => {
      try {
        const { error } = await supabase
          .from("hiring_requests")
          .update({
            hr_assigned_to_id: hrId,
            hr_assigned_to_name: hrName,
          })
          .eq("id", requestId);
        if (error) throw error;
        toast("Assignee Updated", hrName ? `Assigned to ${hrName}.` : "Assignee cleared.", "success");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to update HR assignee", "error");
      }
    },
    [loadData]
  );

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
        const isBranchStage = !targetRequest.status || targetRequest.status === "pending" || targetRequest.status === "pending_branch_review";

        if (decisionAction === "approved") {
          if (isBranchStage) {
            // Stage 1: Branch Approval -> Forward to HR Division
            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "pending_hr_review",
                branch_approved_by: actorName,
                branch_approved_at: new Date().toISOString(),
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            const originatingBranch = targetRequest.branches?.name || "Headquarters";

            // Find HR Division branch ID if exists
            const { data: hrBranch } = await supabase
              .from("branches")
              .select("id, name")
              .ilike("name", "%HR%")
              .is("deleted_at", null)
              .maybeSingle();

            // 1. In-app notification to HR Division
            await notify({
              title: `📋 Requisition Forwarded to HR: ${targetRequest.title}`,
              message: `${actorName} endorsed ${targetRequest.headcount}x ${targetRequest.title} from ${originatingBranch}. Awaiting HR authorization & job publishing.`,
              type: "info",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: hrBranch?.id || null,
            });

            toast("Approved & Forwarded", "Requisition approved and routed to HR Division.", "success");

            notifyTelegramEvent(
              `🏢 <b>Hiring Requisition Approved by Branch (${escapeTelegramHtml(actorRole)})</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
              `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
              `👤 <b>Approved By:</b> ${escapeTelegramHtml(actorName)}\n` +
              `⏩ <b>Next Step:</b> Automatically forwarded to HR Division for final authorization.`,
              { text: "Review in HR Division", url: hrNexusUrl("/hire") }
            );
          } else {
            // Stage 2: Final HR Division Authorization -> Create live job posting
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
                  status: "active",
                },
              ])
              .select()
              .single();

            if (jobErr) throw jobErr;

            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "approved",
                hr_reviewed_by: actorName,
                hr_reviewed_at: new Date().toISOString(),
                reviewed_by: actorName,
                reviewed_at: new Date().toISOString(),
                job_posting_id: jobData?.id,
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            const branchName = targetRequest.branches?.name || "Headquarters";

            // In-app alert back to the requesting branch
            await notify({
              title: `🎉 Requisition Authorized: ${targetRequest.title}`,
              message: `${actorName} in HR Division authorized the hiring request for ${branchName}. Live job posting is now published!`,
              type: "success",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: targetRequest.branch_id || null,
            });

            toast("Authorized & Published", "Live job posting published on recruitment portal.", "success");

            notifyTelegramEvent(
              `✅ <b>Hiring Requisition Finalized by HR Division</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
              `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(branchName)}\n` +
              `👤 <b>Authorized By:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
              `📢 <b>Action:</b> Live Job Opening published on recruitment portal.`,
              { text: "View Live Job", url: hrNexusUrl("/hire") }
            );
          }
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

          const branchName = targetRequest.branches?.name || "Headquarters";

          // In-app alert back to the requesting branch
          await notify({
            title: `❌ Requisition Declined: ${targetRequest.title}`,
            message: `Hiring requisition for ${branchName} was declined by ${actorName} (${actorRole}). Reason: ${rejectionReason.trim()}`,
            type: "warning",
            source: "hire",
            entityId: targetRequest.id,
            branch_id: targetRequest.branch_id || null,
          });

          toast("Requisition Rejected", "Decision recorded and manager notified.", "info");

          notifyTelegramEvent(
            `❌ <b>Hiring Requisition Rejected (${escapeTelegramHtml(actorRole)})</b>\n` +
            `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)}\n` +
            `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
            `📍 <b>Branch:</b> ${escapeTelegramHtml(branchName)}\n` +
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
    [targetRequest, decisionAction, rejectionReason, actorName, actorRole, loadData]
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
