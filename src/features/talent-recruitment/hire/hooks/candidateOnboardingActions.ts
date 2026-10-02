import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import type { Candidate, Job } from "../types";

export async function executeMoveToOnboarding(params: {
  candidate: Candidate;
  branchId: string;
  joinDate: string;
  actorName: string;
  jobs: Job[];
  branches: any[];
}): Promise<boolean> {
  const { candidate, branchId, joinDate, actorName, jobs, branches } = params;

  if (!branchId || !joinDate) return false;

  const job = jobs.find((j) => j.id === candidate.job_posting_id);
  const nameParts = candidate.full_name.trim().split(/\s+/);
  const isSite = branchId.startsWith("site:");
  const siteObj = isSite ? branches.find((b: any) => b.id === branchId) : null;
  const targetBranchId = isSite ? siteObj?.branch_id : branchId;
  const targetSiteId = isSite ? branchId.substring(5) : null;

  const { data: existingEmp } = await supabase
    .from("employees")
    .select("id")
    .eq("email", candidate.email)
    .maybeSingle();

  const employeePayload = {
    first_name: nameParts[0] || candidate.full_name,
    last_name: nameParts.slice(1).join(" ") || "-",
    email: candidate.email,
    phone: candidate.phone || null,
    role: job?.title || "New Hire",
    department: job?.department || "General",
    branch_id: targetBranchId,
    default_work_location_id: targetSiteId,
    status: "onboarding",
    join_date: joinDate,
    candidate_id: candidate.id,
    candidate_code: candidate.candidate_code || null,
    location: candidate.location || null,
    education: candidate.education || null,
    work_experience: candidate.work_experience || null,
    skills: candidate.skills || [],
    languages: candidate.languages || [],
    expected_salary: candidate.expected_salary ? Number(candidate.expected_salary) : null,
    notice_period: candidate.notice_period || null,
    resume_url: candidate.resume_url || null,
    resume_name: candidate.resume_name || null,

    // 33 Standardized Hiring Information Fields
    kh_name: candidate.kh_name || null,
    gender: candidate.gender || null,
    code_bu: candidate.code_bu || null,
    bu_full_name: candidate.bu_full_name || candidate.business_unit || null,
    handle_bu: candidate.handle_bu || null,
    division: candidate.division || null,
    position: candidate.position || job?.title || null,
    working_hour: candidate.working_hour || null,
    total_working_days: candidate.total_working_days || null,
    employment_type: candidate.employment_type || null,
    start_date: candidate.start_date || joinDate,
    working_location: candidate.working_location || candidate.location || null,
    national_id_number: candidate.national_id_number || null,
    date_of_birth: candidate.date_of_birth || null,
    current_address: candidate.current_address || candidate.location || null,
    basic_salary: candidate.basic_salary != null ? candidate.basic_salary : (candidate.expected_salary ? Number(candidate.expected_salary) : null),
    tax_method: candidate.tax_method || null,
    allowance: candidate.allowance || null,
    line_manager: candidate.line_manager || null,
    contract_type: candidate.contract_type || null,
    fdc_end_date: candidate.fdc_end_date || null,
    site: candidate.site || null,
    bank_account_number: candidate.bank_account_number || null,
    bank_name: candidate.bank_name || null,
    nssf_number: candidate.nssf_number || null,
    emergency_contact_name: candidate.emergency_contact_name || null,
    emergency_phone_number: candidate.emergency_phone_number || null,
    hiring_status: candidate.hiring_status || null,
    marital_status: candidate.marital_status || null,
  };

  let employeeId: string;
  if (existingEmp?.id) {
    employeeId = existingEmp.id;
    const { error: updErr } = await supabase
      .from("employees")
      .update(employeePayload)
      .eq("id", employeeId);
    if (updErr) throw updErr;
  } else {
    const { data: newEmp, error: empErr } = await supabase
      .from("employees")
      .insert(employeePayload)
      .select()
      .single();
    if (empErr) throw empErr;
    employeeId = newEmp.id;
  }

  await startOnboardingForEmployee(employeeId, actorName);
  await supabase.from("candidates").update({ stage: "hired" }).eq("id", candidate.id);

  if (candidate.job_posting_id) {
    await supabase
      .from("candidate_applications")
      .update({ stage: "hired", outcome: "hired" })
      .eq("candidate_id", candidate.id)
      .eq("job_posting_id", candidate.job_posting_id);
  }

  toast("Moved to Onboarding", `${candidate.full_name} is now in onboarding with full credentials transferred.`, "success");
  return true;
}
