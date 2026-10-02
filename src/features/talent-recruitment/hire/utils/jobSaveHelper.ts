import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Job } from "../types";

export async function executeSaveJob(
  jobForm: any,
  editingJob: Job | null,
  branches: any[]
): Promise<boolean> {
  if (!jobForm.title || !jobForm.department) {
    toast("Validation Error", "Title and department are required.", "error");
    return false;
  }

  const isSite = jobForm.branch_id && jobForm.branch_id.startsWith("site:");
  const siteObj = isSite ? branches.find((b: any) => b.id === jobForm.branch_id) : null;
  const branchId = isSite ? siteObj?.branch_id : (jobForm.branch_id || null);
  const resolvedLocation = isSite ? siteObj?.name : jobForm.location;

  const payload: any = {
    title: jobForm.title,
    department: jobForm.department,
    branch_id: branchId,
    description: jobForm.description || null,
    location: resolvedLocation || null,
    salary_min: jobForm.salary_min ? Number(jobForm.salary_min) : null,
    salary_max: jobForm.salary_max ? Number(jobForm.salary_max) : null,
    type: jobForm.type,
    closing_date: jobForm.closing_date || null,
  };

  if (editingJob) {
    const { error } = await supabase.from("job_postings").update(payload).eq("id", editingJob.id);
    if (error) throw error;
    toast("Job Updated", `"${jobForm.title}" saved.`, "success");
  } else {
    payload.status = "active";
    const { error } = await supabase.from("job_postings").insert(payload);
    if (error) throw error;
    toast("Job Posted", `"${jobForm.title}" is now open.`, "success");
  }

  return true;
}
