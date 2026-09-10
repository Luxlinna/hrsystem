import { supabase } from "@/lib/supabase";
import {
  notifyStageTransition,
  notifyFullRequisitionApproval,
  notifyRequisitionRejectedOrRevised,
} from "../services/notifications/recruitmentEventTriggers";
import type { HiringRequest } from "../types";

export interface ProcessDecisionContext {
  targetRequest: HiringRequest;
  actorName: string;
  actorRole: string;
  userBranchName?: string;
  isChairmanOrSuper: boolean;
}

export async function executeApprovalStep(ctx: ProcessDecisionContext) {
  const { targetRequest, actorName, actorRole, userBranchName, isChairmanOrSuper } = ctx;
  const status = targetRequest.status || "pending";
  const isStage1Branch = status === "pending" || status === "pending_branch_review";
  const isStage2HrReview = status === "pending_hr_review";
  const isStage3HrAdmin = status === "pending_hr_admin_review";
  const originatingBranch = targetRequest.branches?.name || userBranchName || "Headquarters";
  const currentBranch = userBranchName || "HR Division";
  const nowIso = new Date().toISOString();

  if (isStage1Branch) {
    const { error: reqErr } = await supabase
      .from("hiring_requests")
      .update({
        status: "pending_hr_review",
        branch_approved_by: `${actorName} (${actorRole} · ${originatingBranch})`,
        branch_approved_at: nowIso,
        stage_entered_at: nowIso,
      })
      .eq("id", targetRequest.id);

    if (reqErr) throw reqErr;

    const { data: hrBranch } = await supabase
      .from("branches")
      .select("id, name")
      .ilike("name", "%HR%")
      .is("deleted_at", null)
      .maybeSingle();

    await notifyStageTransition(
      targetRequest,
      "HR Manager Review",
      "HR Manager",
      actorName,
      actorRole,
      hrBranch?.id || null
    );
    return { title: "Endorsed", message: `Requisition endorsed by ${actorName} and forwarded to HR Manager.` };
  }

  if (isStage2HrReview) {
    const { error: reqErr } = await supabase
      .from("hiring_requests")
      .update({
        status: "pending_hr_admin_review",
        hr_reviewed_by: `${actorName} (${actorRole} · ${currentBranch})`,
        hr_reviewed_at: nowIso,
        stage_entered_at: nowIso,
      })
      .eq("id", targetRequest.id);

    if (reqErr) throw reqErr;

    await notifyStageTransition(
      targetRequest,
      "HR Admin Director Approval",
      "HR Admin Director",
      actorName,
      actorRole,
      null
    );
    return { title: "Reviewed & Forwarded", message: `Requisition reviewed by HR Manager ${actorName} and forwarded to HR Admin Director.` };
  }

  if (isStage3HrAdmin) {
    const { error: reqErr } = await supabase
      .from("hiring_requests")
      .update({
        status: "pending_chairman_review",
        hr_admin_approved_by: `${actorName} (${actorRole} · ${currentBranch})`,
        hr_admin_approved_at: nowIso,
        stage_entered_at: nowIso,
      })
      .eq("id", targetRequest.id);

    if (reqErr) throw reqErr;

    await notifyStageTransition(
      targetRequest,
      "Chairwoman / Chairman Final Authorization",
      "Chairwoman / Executive Chairman",
      actorName,
      actorRole,
      null
    );
    return { title: "Approved & Escalated", message: `Requisition approved by HR Admin Director ${actorName} and forwarded to Chairwoman/Chairman.` };
  }

  // Final Stage: Executive Authorization -> Create live job posting & Go Live
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
        description: targetRequest.justification ? `Approved Requisition: ${targetRequest.justification}` : null,
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
      chairman_approved_at: nowIso,
      reviewed_by: chairmanRecord,
      reviewed_at: nowIso,
      job_posting_id: jobData?.id,
      stage_entered_at: nowIso,
    })
    .eq("id", targetRequest.id);

  if (reqErr) throw reqErr;

  await notifyFullRequisitionApproval(targetRequest, actorName, actorRole, jobData?.id);
  return { title: "Authorized & Live", message: `Requisition authorized by ${actorName}. Recruiter sourcing triggered & job opening live!` };
}

export async function executeRejectionStep(ctx: ProcessDecisionContext, reason: string) {
  const { targetRequest, actorName, actorRole } = ctx;
  const nowIso = new Date().toISOString();

  const { error: reqErr } = await supabase
    .from("hiring_requests")
    .update({
      status: "rejected",
      reviewed_by: actorName,
      reviewed_at: nowIso,
      rejection_reason: reason.trim(),
      stage_entered_at: nowIso,
    })
    .eq("id", targetRequest.id);

  if (reqErr) throw reqErr;

  await notifyRequisitionRejectedOrRevised(targetRequest, actorName, actorRole, reason.trim(), false);
  return { title: "Requisition Rejected", message: "Decision recorded, requester and recruiter notified." };
}
