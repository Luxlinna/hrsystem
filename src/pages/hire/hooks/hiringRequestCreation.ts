import { supabase } from "@/lib/supabase";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { getDefaultRecruiter } from "../services/notifications/recruitmentRecipients";
import { sendDualRecruitmentNotification } from "../services/notifications/recruitmentNotifyEngine";
import { notifyRequisitionSubmitted } from "@/services/notifications/recruitmentNotificationTriggers";
import { notifyStageTransition } from "../services/notifications/recruitmentEventTriggers";
import type { NewHiringRequestFormState, Branch } from "../types";

export interface SubmitHiringRequestParams {
  requestForm: NewHiringRequestFormState;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  myEmployeeId?: string;
  userBranchId?: string | null;
  userBranchName?: string | null;
  branches: Branch[];
  isBranchAdmin?: boolean;
  canBranchApprove?: boolean;
}

async function getNextRequisitionId(): Promise<string> {
  const yr = new Date().getFullYear();
  const prefix = `REQ-${yr}-`;
  try {
    const { data } = await supabase
      .from("hiring_requests")
      .select("requisition_id")
      .like("requisition_id", `${prefix}%`)
      .order("requisition_id", { ascending: false })
      .limit(10);

    let maxNum = 0;
    (data || []).forEach((row) => {
      const parts = (row.requisition_id || "").split("-");
      const num = parseInt(parts[2] || "0", 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });

    return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
  } catch (err) {
    console.error("getNextRequisitionId error:", err);
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}

export async function submitHiringRequest(params: SubmitHiringRequestParams) {
  const {
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
  } = params;

  const selectedBranchObj = branches.find((b) => b.id === requestForm.branch_id);
  const resolvedBranchId = selectedBranchObj?.is_site
    ? selectedBranchObj.branch_id || null
    : requestForm.branch_id || userBranchId || null;

  let assignedRecruiterId = requestForm.assigned_recruiter_id || null;
  let assignedRecruiterName = requestForm.assigned_recruiter_name || null;

  if (!assignedRecruiterId) {
    const defaultRec = await getDefaultRecruiter();
    if (defaultRec) {
      assignedRecruiterId = defaultRec.id;
      assignedRecruiterName = defaultRec.name;
    }
  }

  // Detect if creator is BU CEO Admin / Branch Admin authority
  const isBuCeoAdmin = Boolean(
    isBranchAdmin ||
    canBranchApprove ||
    /(branch|bu)\s*.*admin/i.test(actorRole) ||
    /(branch|bu)\s*ceo/i.test(actorRole) ||
    /\bceo\b/i.test(actorRole)
  );

  const nowIso = new Date().toISOString();
  const branchName = selectedBranchObj?.name || userBranchName || "Headquarters";

  const payload = {
    title: requestForm.title.trim(),
    department: requestForm.department.trim(),
    division: requestForm.division?.trim() || null,
    company: requestForm.company?.trim() || "UNI",
    business_unit: requestForm.business_unit?.trim() || userBranchName || selectedBranchObj?.name || null,
    branch_id: resolvedBranchId,
    position_type: requestForm.position_type || "new",
    replacement_for_id: requestForm.position_type === "replacement" ? requestForm.replacement_for_id || null : null,
    replacement_for_name: requestForm.position_type === "replacement" ? requestForm.replacement_for_name || null : null,
    location: requestForm.location?.trim() || null,
    target_joining_date: requestForm.target_joining_date || null,
    job_description: requestForm.job_description?.trim() || (requestForm.jd_summary ? `${requestForm.jd_summary}\n\nKey Responsibilities:\n${requestForm.jd_responsibilities || ''}\n\nRequirements:\n${requestForm.jd_requirements || ''}\n\nQualifications:\n${requestForm.jd_qualifications || ''}` : null),
    jd_summary: requestForm.jd_summary?.trim() || null,
    jd_responsibilities: requestForm.jd_responsibilities?.trim() || null,
    jd_requirements: requestForm.jd_requirements?.trim() || null,
    jd_qualifications: requestForm.jd_qualifications?.trim() || null,
    jd_reporting_line: requestForm.jd_reporting_line?.trim() || null,
    jd_template_id: requestForm.jd_template_id || null,
    jd_version: 1,
    hiring_manager_id: requestForm.hiring_manager_id || null,
    hiring_manager_name: requestForm.hiring_manager_name?.trim() || null,
    assigned_recruiter_id: assignedRecruiterId,
    assigned_recruiter_name: assignedRecruiterName,
    hr_assigned_to_id: assignedRecruiterId,
    hr_assigned_to_name: assignedRecruiterName,
    requested_by_id: myEmployeeId || null,
    requested_by_name: actorName,
    requested_by_email: actorEmail || null,
    headcount: Number(requestForm.headcount) || 1,
    employment_type: requestForm.employment_type,
    salary_min: Number(requestForm.salary_min) || null,
    salary_max: Number(requestForm.salary_max) || null,
    justification: requestForm.justification.trim() || null,
    urgency: requestForm.urgency,
    // When created by BU CEO Admin, skip Stage 1 self-approval and advance straight to Stage 2: HR Manager Review
    status: isBuCeoAdmin ? "pending_hr_review" : "pending",
    branch_approved_by: isBuCeoAdmin ? `${actorName} (${actorRole} · ${branchName})` : null,
    branch_approved_at: isBuCeoAdmin ? nowIso : null,
    stage_entered_at: nowIso,
  };

  const initialReqId = await getNextRequisitionId();
  let currentReqId = initialReqId;
  let data: any = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const insertPayload = { ...payload, requisition_id: currentReqId };
    const { data: resData, error } = await supabase
      .from("hiring_requests")
      .insert([insertPayload])
      .select("*, branches(name)")
      .single();

    if (!error && resData) {
      data = resData;
      break;
    }

    if (error && (error.message?.includes("requisition_id") || error.code === "23505")) {
      const parts = currentReqId.split("-");
      const curNum = parseInt(parts[2] || "0", 10) + 1;
      currentReqId = `${parts[0]}-${parts[1]}-${String(curNum).padStart(4, "0")}`;
      continue;
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to generate unique requisition ID. Please try again.");
  }

  const effectiveBranchName = data?.branches?.name || branchName;
  const reqCode = data?.requisition_id ? `[${data.requisition_id}] ` : "";

  // Find HR Branch for routing notifications to HR Division
  const { data: hrBranch } = await supabase
    .from("branches")
    .select("id, name")
    .ilike("name", "%HR%")
    .is("deleted_at", null)
    .maybeSingle();

  if (isBuCeoAdmin) {
    // Stage 1 is auto-endorsed by the BU CEO creator. Route directly to HR Manager at HR Division.
    await sendDualRecruitmentNotification({
      title: `📋 New Requisition: ${reqCode}${payload.title}`,
      approverMessage: `${actorName} created and endorsed requisition ${reqCode}${payload.title} (${payload.headcount} headcount in ${payload.department}, ${effectiveBranchName}). Forwarded to HR Division for HR Manager review.`,
      recruiterMessage: `New Requisition Created: ${reqCode}${payload.title} (${payload.department} · ${effectiveBranchName}) by BU CEO ${actorName}. Forwarded to HR Manager. Standing subscription active.`,
      type: "info",
      entityId: data?.id,
      approverBranchId: hrBranch?.id || null,
      recruiterEmployeeId: assignedRecruiterId,
      recruiterName: assignedRecruiterName,
      telegramHtml:
        `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
        `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
        `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || effectiveBranchName)}\n` +
        `👤 <b>Requester / BU CEO:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
        `✍️ <b>Stage 1:</b> Endorsed by BU CEO\n` +
        `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(assignedRecruiterName || "Recruiter")}\n` +
        `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
        `🎯 <b>Next Action:</b> HR Manager Review (HR Division)`,
      telegramButtonText: "Review Requisition",
      telegramUrl: hrNexusUrl("/hire"),
      auditAction: "requisition_created_bu_ceo",
      actorName,
      actorRole,
      description: `Hiring requisition submitted & endorsed by BU CEO: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${effectiveBranchName}. Routed to HR Manager.`,
    });

    // Notify HR Division / HR Manager
    try {
      await notifyStageTransition(
        data,
        "HR Manager Review",
        "HR Manager",
        actorName,
        actorRole,
        hrBranch?.id || null,
        {
          businessUnit: effectiveBranchName,
          targetBusinessUnit: "HR Division",
          isCrossBu: effectiveBranchName !== "HR Division",
          auditAction: "requisition_bu_ceo_submitted",
          description: `${actorName} (${actorRole}) created and endorsed requisition ${reqCode}${payload.title} for ${effectiveBranchName}. Moved to HR Manager Review.`,
        }
      );
    } catch {
      // Non-fatal
    }
  } else {
    // Normal Manager submission: awaits Stage 1 Branch Leadership / BU CEO review
    await sendDualRecruitmentNotification({
      title: `📋 New Requisition: ${reqCode}${payload.title}`,
      approverMessage: `${actorName} requested ${payload.headcount} headcount in ${payload.department} (${effectiveBranchName}). Awaiting branch endorsement.`,
      recruiterMessage: `New Requisition Created: ${reqCode}${payload.title} (${payload.department} · ${effectiveBranchName}). Standing subscription active.`,
      type: "info",
      entityId: data?.id,
      approverBranchId: resolvedBranchId,
      recruiterEmployeeId: assignedRecruiterId,
      recruiterName: assignedRecruiterName,
      telegramHtml:
        `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
        `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
        `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
        `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || effectiveBranchName)}\n` +
        `👤 <b>Requester:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
        `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(assignedRecruiterName || "Recruiter")}\n` +
        `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
        `🎯 <b>Next Action:</b> Branch Review & Endorsement`,
      telegramButtonText: "Review Requisition",
      telegramUrl: hrNexusUrl("/hire"),
      auditAction: "created",
      actorName,
      actorRole,
      description: `Hiring requisition submitted: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${effectiveBranchName}`,
    });

    try {
      await notifyRequisitionSubmitted({
        requisition: data as any,
        submittedBy: actorName,
        submitterRole: actorRole,
        businessUnit: effectiveBranchName,
      });
    } catch {
      // Non-fatal
    }
  }

  return { data, reqCode, branchName: effectiveBranchName, isBuCeoAdmin };
}
