import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import type { Job, Candidate } from "../types";

export interface MoveCandidateToOnboardingParams {
  candidate: Candidate;
  branchId: string;
  joinDate: string;
  job?: Job;
  actorName: string;
  actorRole: string;
}

export async function executeMoveCandidateToOnboarding(
  params: MoveCandidateToOnboardingParams
): Promise<boolean> {
  const { candidate, branchId, joinDate, job, actorName, actorRole } = params;

  const [first_name, ...rest] = candidate.full_name.trim().split(/\s+/);
  const last_name = rest.join(" ") || "-";

  const { data: existingEmp } = await supabase
    .from("employees")
    .select("id")
    .eq("email", candidate.email)
    .maybeSingle();

  let employeeId = existingEmp?.id as string | undefined;

  const employeePayload = {
    first_name,
    last_name,
    email: candidate.email,
    phone: candidate.phone || null,
    role: job?.title || null,
    department: job?.department || null,
    branch_id: branchId || null,
    status: "onboarding",
    join_date: joinDate,
    // Transfer full Candidate Master Database credentials
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

  if (!employeeId) {
    const { data: newEmp, error: empError } = await supabase
      .from("employees")
      .insert(employeePayload)
      .select()
      .single();

    if (empError) {
      toast("Error", "Failed to create employee record for onboarding: " + empError.message, "error");
      return false;
    }
    employeeId = newEmp.id;
  } else {
    await supabase.from("employees").update(employeePayload).eq("id", employeeId);

    const { data: existingRequest } = await supabase
      .from("onboarding_requests")
      .select("id")
      .eq("employee_id", employeeId)
      .maybeSingle();
    if (existingRequest) {
      toast("Already Onboarded", `${candidate.full_name} already has an onboarding journey in progress.`, "error");
      return false;
    }
  }

  // Mark candidate as hired & update application record
  await supabase.from("candidates").update({ stage: "hired" }).eq("id", candidate.id);
  if (candidate.job_posting_id) {
    await supabase
      .from("candidate_applications")
      .update({ stage: "hired", outcome: "hired" })
      .eq("candidate_id", candidate.id)
      .eq("job_posting_id", candidate.job_posting_id);
  }

  const { data, error } = await startOnboardingForEmployee(employeeId!, actorName);

  if (error) {
    toast("Error", "Failed to start onboarding journey", "error");
    return false;
  }

  toast("Moved to Onboarding", `${candidate.full_name} has been added to Onboarding with master credentials transferred.`, "success");
  logActivity({
    module: "onboarding",
    action: "created",
    entityType: "onboarding_request",
    entityId: data.id,
    actorName,
    actorRole,
    description: `${candidate.full_name} moved from Recruitment to Onboarding after being hired`,
  });
  notify({
    source: "onboarding",
    type: "info",
    title: "Onboarding started",
    message: `${candidate.full_name}'s onboarding journey has begun.`,
    entityId: data.id,
  });

  return true;
}
