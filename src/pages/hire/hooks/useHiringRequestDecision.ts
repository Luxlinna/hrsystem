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
  userBranchName?: string;
  loadData: () => Promise<void>;
}

export function useHiringRequestDecision({
  actorName,
  actorRole,
  userBranchName,
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
        const status = targetRequest.status || "pending";
        const isStage1Branch = status === "pending" || status === "pending_branch_review";
        const isStage2HrReview = status === "pending_hr_review";
        const isStage3HrAdmin = status === "pending_hr_admin_review";
        const isStage4Chairman = status === "pending_chairman_review";

        const originatingBranch = targetRequest.branches?.name || userBranchName || "Headquarters";
        const currentBranch = userBranchName || "HR Division";

        if (decisionAction === "approved") {
          if (isStage1Branch) {
            // Stage 1: Branch Approval -> Forward to HR Division (HR Manager)
            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "pending_hr_review",
                branch_approved_by: `${actorName} (${actorRole} · ${originatingBranch})`,
                branch_approved_at: new Date().toISOString(),
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            const { data: hrBranch } = await supabase
              .from("branches")
              .select("id, name")
              .ilike("name", "%HR%")
              .is("deleted_at", null)
              .maybeSingle();

            await notify({
              title: `📋 HR Manager Review Required (${targetRequest.title})`,
              message: `${actorName} endorsed ${targetRequest.headcount}x ${targetRequest.title} from ${originatingBranch}. Forwarded to HR Manager for review.`,
              type: "info",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: hrBranch?.id || null,
            });

            toast("Endorsed", `Requisition endorsed by ${actorName} and forwarded to HR Manager.`, "success");

            notifyTelegramEvent(
              `🏢 <b>Branch Endorsement: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(originatingBranch)})</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
              `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
              `⏩ <b>Next Step:</b> In HR Manager Review.`,
              { text: "Review in HR Division", url: hrNexusUrl("/hire") }
            );
          } else if (isStage2HrReview) {
            // Stage 2: HR Manager Review -> Forward to HR Division Admin
            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "pending_hr_admin_review",
                hr_reviewed_by: `${actorName} (${actorRole} · ${currentBranch})`,
                hr_reviewed_at: new Date().toISOString(),
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            const { data: hrBranch } = await supabase
              .from("branches")
              .select("id, name")
              .ilike("name", "%HR%")
              .is("deleted_at", null)
              .maybeSingle();

            await notify({
              title: `📋 HR Division Admin Approval Required (${targetRequest.title})`,
              message: `HR Manager ${actorName} reviewed and endorsed ${targetRequest.title} (${originatingBranch}). Awaiting HR Division Admin approval.`,
              type: "info",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: hrBranch?.id || null,
            });

            toast("Reviewed", `Requisition reviewed by ${actorName} and forwarded to HR Admin.`, "success");

            notifyTelegramEvent(
              `📑 <b>HR Manager Review: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(currentBranch)})</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
              `⏩ <b>Next Step:</b> Awaiting HR Division Admin Approval.`,
              { text: "Review as HR Admin", url: hrNexusUrl("/hire") }
            );
          } else if (isStage3HrAdmin) {
            // Stage 3: HR Division Admin Approval -> Forward to Chairman
            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "pending_chairman_review",
                hr_admin_approved_by: `${actorName} (${actorRole} · ${currentBranch})`,
                hr_admin_approved_at: new Date().toISOString(),
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            await notify({
              title: `👑 Chairman Authorization Required (${targetRequest.title})`,
              message: `HR Division Admin ${actorName} approved ${targetRequest.title} (${originatingBranch}). Awaiting Chairman final executive authorization.`,
              type: "warning",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: null,
            });

            toast("Approved", `Requisition approved by HR Admin ${actorName} and escalated to Chairman.`, "success");

            notifyTelegramEvent(
              `🏛️ <b>HR Admin Approval: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)} · ${escapeTelegramHtml(currentBranch)})</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
              `⏩ <b>Next Step:</b> Awaiting Executive Chairman Final Authorization.`,
              { text: "Review as Chairman", url: hrNexusUrl("/hire") }
            );
          } else {
            // Stage 4: Chairman Executive Authorization -> Create live job posting & Complete
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

            const chairmanRecord = `${actorName} (${actorRole} · ${userBranchName || "Executive"})`;

            const { error: reqErr } = await supabase
              .from("hiring_requests")
              .update({
                status: "approved",
                chairman_approved_by: chairmanRecord,
                chairman_approved_at: new Date().toISOString(),
                reviewed_by: chairmanRecord,
                reviewed_at: new Date().toISOString(),
                job_posting_id: jobData?.id,
              })
              .eq("id", targetRequest.id);

            if (reqErr) throw reqErr;

            await notify({
              title: `🎉 Requisition Authorized by Chairman: ${targetRequest.title}`,
              message: `Chairman ${actorName} fully authorized the hiring request for ${originatingBranch}. Live recruitment posting is now active!`,
              type: "success",
              source: "hire",
              entityId: targetRequest.id,
              branch_id: targetRequest.branch_id || null,
            });

            toast("Authorized & Published", `Chairman ${actorName} authorized live recruitment posting.`, "success");

            notifyTelegramEvent(
              `👑 <b>Authorized by Chairman: ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})</b>\n` +
              `💼 <b>Position:</b> ${escapeTelegramHtml(targetRequest.title)} (${targetRequest.headcount} opening${targetRequest.headcount > 1 ? "s" : ""})\n` +
              `🏢 <b>Department:</b> ${escapeTelegramHtml(targetRequest.department)}\n` +
              `📍 <b>Branch:</b> ${escapeTelegramHtml(originatingBranch)}\n` +
              `📢 <b>Outcome:</b> Live Job Opening published on recruitment portal.`,
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
    [targetRequest, decisionAction, rejectionReason, actorName, actorRole, userBranchName, loadData]
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
