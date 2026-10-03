import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Candidate, Job, CandidateDocument } from "../types";
import { notifyNewCandidateApplication } from "../services/notifications/recruitmentEventTriggers";
import { uploadCandidateFiles } from "./candidateUploadHelpers";

export async function executeSaveCandidate(params: {
  candidateForm: any;
  editingCandidate: Candidate | null;
  filesToUpload?: File[] | File | null;
  jobs: Job[];
}): Promise<boolean> {
  const { candidateForm, editingCandidate, filesToUpload, jobs } = params;

  if (!candidateForm.full_name || !candidateForm.email || !candidateForm.job_posting_id) {
    toast("Validation Error", "Name, email, and job are required.", "error");
    return false;
  }

  const filesList: File[] = Array.isArray(filesToUpload) ? filesToUpload : filesToUpload ? [filesToUpload] : [];
  const newDocs = await uploadCandidateFiles(filesList);
  const existingDocs: CandidateDocument[] = editingCandidate?.documents || (
    editingCandidate?.resume_url ? [{ name: editingCandidate.resume_name || "Resume", url: editingCandidate.resume_url }] : []
  );
  const allDocs = [...existingDocs, ...newDocs];
  const primaryDoc = allDocs[0] || null;
  const parseArray = (str?: string) => (str ? str.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : []);

  const payload: any = {
    full_name: candidateForm.full_name,
    email: candidateForm.email,
    phone: candidateForm.phone || null,
    location: candidateForm.location || null,
    education: candidateForm.education || null,
    work_experience: candidateForm.work_experience || null,
    skills: parseArray(candidateForm.skills),
    languages: parseArray(candidateForm.languages),
    expected_salary: candidateForm.expected_salary ? Number(candidateForm.expected_salary) : null,
    notice_period: candidateForm.notice_period || null,
    assigned_recruiter_id: candidateForm.assigned_recruiter_id || null,
    tags: parseArray(candidateForm.tags),
    job_posting_id: candidateForm.job_posting_id || null,
    source: candidateForm.source,
    notes: candidateForm.notes || null,
    documents: allDocs,
    ...(primaryDoc ? { resume_url: primaryDoc.url, resume_name: primaryDoc.name } : {}),
  };

  const matchedJob = jobs.find((j) => j.id === candidateForm.job_posting_id);

  if (editingCandidate) {
    const { error } = await supabase.from("candidates").update(payload).eq("id", editingCandidate.id);
    if (error) throw error;
    toast("Candidate Profile Updated", `"${candidateForm.full_name}" master profile saved.`, "success");
  } else {
    payload.stage = "cv_received";
    const { data: newCand, error } = await supabase.from("candidates").insert(payload).select().single();
    if (error) throw error;
    if (newCand?.id && candidateForm.job_posting_id) {
      await supabase.from("candidate_applications").insert({
        candidate_id: newCand.id,
        job_posting_id: candidateForm.job_posting_id,
        stage: "cv_received",
        source: candidateForm.source,
        outcome: "in_progress",
        notes: candidateForm.notes || null,
      });
    }

    // Standing Dual Notification
    await notifyNewCandidateApplication({
      candidateName: candidateForm.full_name,
      candidateId: newCand.id,
      jobTitle: matchedJob?.title || "Open Position",
      source: candidateForm.source,
      recruiterEmployeeId: candidateForm.assigned_recruiter_id || null,
      branchId: matchedJob?.branch_id || null,
    });

    toast("Candidate Created", `"${candidateForm.full_name}" registered in Master Database.`, "success");
  }

  return true;
}
