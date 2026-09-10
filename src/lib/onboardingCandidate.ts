import { supabase } from "@/lib/supabase";
import { startOnboardingForEmployee } from "./onboarding";

export async function startOnboardingForCandidate(
  candidateId: string,
  requestedBy: string,
  branchId?: string,
  joinDate?: string
) {
  try {
    const { data: cand, error: candErr } = await supabase
      .from("candidates")
      .select("*, job_postings(id, title, department, branch_id)")
      .eq("id", candidateId)
      .single();

    if (candErr || !cand) return { data: null, error: candErr || new Error("Candidate not found") };

    const nameParts = (cand.full_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || cand.full_name;
    const lastName = nameParts.slice(1).join(" ") || "-";
    const job = cand.job_postings;

    const employeePayload = {
      first_name: firstName,
      last_name: lastName,
      email: cand.email,
      phone: cand.phone || null,
      role: job?.title || "New Hire",
      department: job?.department || "General",
      branch_id: branchId || job?.branch_id || null,
      status: "onboarding",
      join_date: joinDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      candidate_id: cand.id,
      candidate_code: cand.candidate_code || null,
      location: cand.location || null,
      education: cand.education || null,
      work_experience: cand.work_experience || null,
      skills: cand.skills || [],
      languages: cand.languages || [],
      expected_salary: cand.expected_salary ? Number(cand.expected_salary) : null,
      notice_period: cand.notice_period || null,
      resume_url: cand.resume_url || null,
      resume_name: cand.resume_name || null,
    };

    let employeeId: string | null = null;
    if (cand.id) {
      const { data: emp } = await supabase.from("employees").select("id").eq("candidate_id", cand.id).is("deleted_at", null).maybeSingle();
      if (emp?.id) employeeId = emp.id;
    }
    if (!employeeId && cand.email) {
      const { data: emp } = await supabase.from("employees").select("id").eq("email", cand.email).is("deleted_at", null).maybeSingle();
      if (emp?.id) employeeId = emp.id;
    }

    if (employeeId) {
      await supabase.from("employees").update(employeePayload).eq("id", employeeId);
    } else {
      const { data: newEmp, error: empErr } = await supabase.from("employees").insert(employeePayload).select("id").single();
      if (empErr) return { data: null, error: empErr };
      employeeId = newEmp.id;
    }

    await supabase.from("candidates").update({ stage: "hired" }).eq("id", cand.id);
    if (cand.job_posting_id) {
      await supabase.from("candidate_applications").update({ stage: "hired", outcome: "hired" }).eq("candidate_id", cand.id).eq("job_posting_id", cand.job_posting_id);
    }

    return await startOnboardingForEmployee(employeeId, requestedBy);
  } catch (err: any) {
    console.error("Failed in startOnboardingForCandidate:", err);
    return { data: null, error: err };
  }
}
