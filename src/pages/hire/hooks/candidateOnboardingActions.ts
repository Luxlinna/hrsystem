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
