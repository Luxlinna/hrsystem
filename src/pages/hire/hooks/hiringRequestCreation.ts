import { supabase } from "@/lib/supabase";
import { escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { getDefaultRecruiter } from "../services/notifications/recruitmentRecipients";
import { sendDualRecruitmentNotification } from "../services/notifications/recruitmentNotifyEngine";
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
  const { requestForm, actorName, actorRole, actorEmail, myEmployeeId, userBranchId, userBranchName, branches } = params;

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

  const nowIso = new Date().toISOString();
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
    job_description: requestForm.job_description?.trim() || null,
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
    status: "pending",
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

  const branchName = data?.branches?.name || selectedBranchObj?.name || "Headquarters";
  const reqCode = data?.requisition_id ? `[${data.requisition_id}] ` : "";

  // Standing dual notification: Branch Leadership (approver) + Assigned Recruiter
  await sendDualRecruitmentNotification({
    title: `📋 New Requisition: ${reqCode}${payload.title}`,
    approverMessage: `${actorName} requested ${payload.headcount} headcount in ${payload.department} (${branchName}). Awaiting branch endorsement.`,
    recruiterMessage: `New Requisition Created: ${reqCode}${payload.title} (${payload.department} · ${branchName}). Standing subscription active.`,
    type: "info",
    entityId: data?.id,
    approverBranchId: resolvedBranchId,
    recruiterEmployeeId: assignedRecruiterId,
    recruiterName: assignedRecruiterName,
    telegramHtml:
      `📋 <b>New Hiring Requisition ${escapeTelegramHtml(reqCode)}</b>\n` +
      `💼 <b>Position:</b> ${escapeTelegramHtml(payload.title)} (${payload.headcount} opening${payload.headcount > 1 ? "s" : ""})\n` +
      `🏢 <b>Department:</b> ${escapeTelegramHtml(payload.department)}\n` +
      `📍 <b>Location/Branch:</b> ${escapeTelegramHtml(payload.location || branchName)}\n` +
      `👤 <b>Requester:</b> ${escapeTelegramHtml(actorName)} (${escapeTelegramHtml(actorRole)})\n` +
      `🎯 <b>Assigned Recruiter:</b> ${escapeTelegramHtml(assignedRecruiterName || "Recruiter")}\n` +
      `⚡ <b>Priority:</b> ${escapeTelegramHtml(payload.urgency.toUpperCase())}\n` +
      `🎯 <b>Next Action:</b> Branch Review & Endorsement`,
    telegramButtonText: "Review Requisition",
    telegramUrl: hrNexusUrl("/hire"),
    auditAction: "created",
    actorName,
    actorRole,
    description: `Hiring requisition submitted: ${reqCode}${payload.headcount}x ${payload.title} (${payload.department}) for ${branchName}`,
  });

  return { data, reqCode, branchName };
}
