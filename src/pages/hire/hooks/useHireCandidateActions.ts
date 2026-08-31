import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadFileToR2 } from "@/lib/r2-storage";
import type { Candidate, Job, Interview } from "../types";

interface UseHireCandidateActionsProps {
  actorName: string;
  actorRole: string;
  myEmployeeId?: string;
  loadData: () => Promise<void>;
  branches: any[];
  jobs: Job[];
  setUploadingResume: (val: boolean) => void;
  setSchedulingInterview: (val: boolean) => void;
  setMovingToOnboarding: (val: boolean) => void;
  setSavingFeedback: (val: boolean) => void;
}

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export function useHireCandidateActions({
  actorName,
  myEmployeeId,
  loadData,
  branches,
  jobs,
  setUploadingResume,
  setSchedulingInterview,
  setMovingToOnboarding,
  setSavingFeedback,
}: UseHireCandidateActionsProps) {
  const uploadCandidateResume = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadingResume(true);
      try {
        const path = `resumes/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        return await uploadFileToR2(file, path);
      } catch (err: any) {
        toast("Upload Error", err.message || "Failed to upload resume.", "error");
        return null;
      } finally {
        setUploadingResume(false);
      }
    },
    [setUploadingResume]
  );

  const handleSaveCandidate = useCallback(
    async (candidateForm: any, editingCandidate: Candidate | null, resumeFile: File | null) => {
      if (!candidateForm.full_name || !candidateForm.email || !candidateForm.job_posting_id) {
        toast("Validation Error", "Name, email, and job are required.", "error");
        return false;
      }
      try {
        const resumeUrl = resumeFile ? await uploadCandidateResume(resumeFile) : null;
        const payload: any = {
          full_name: candidateForm.full_name,
          email: candidateForm.email,
          phone: candidateForm.phone || null,
          job_posting_id: candidateForm.job_posting_id,
          source: candidateForm.source,
          notes: candidateForm.notes || null,
          ...(resumeUrl ? { resume_url: resumeUrl } : {}),
        };
        if (editingCandidate) {
          const { error } = await supabase.from("candidates").update(payload).eq("id", editingCandidate.id);
          if (error) throw error;
          toast("Candidate Updated", `"${candidateForm.full_name}" saved.`, "success");
        } else {
          payload.stage = "applied";
          const { error } = await supabase.from("candidates").insert(payload);
          if (error) throw error;
          toast("Candidate Added", `"${candidateForm.full_name}" added to pipeline.`, "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save candidate.", "error");
        return false;
      }
    },
    [uploadCandidateResume, loadData]
  );

  const handleSaveInterview = useCallback(
    async (interviewForm: any, editingInterview: Interview | null) => {
      if (!interviewForm.candidate_id || !interviewForm.scheduled_at) {
        toast("Validation Error", "Candidate and date/time are required.", "error");
        return false;
      }
      setSchedulingInterview(true);
      try {
        const payload = {
          candidate_id: interviewForm.candidate_id,
          scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
          duration_minutes: Number(interviewForm.duration_minutes) || 60,
          type: interviewForm.type,
          notes: interviewForm.notes || null,
        };
        if (editingInterview) {
          const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
          if (error) throw error;
          toast("Interview Updated", "Interview details saved.", "success");
        } else {
          const { error } = await supabase.from("interviews").insert({
            ...payload,
            interviewer_id: isUuid(myEmployeeId) ? myEmployeeId : null,
            status: "scheduled",
          });
          if (error) throw error;
          toast("Interview Scheduled", "Interview scheduled successfully.", "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to schedule interview.", "error");
        return false;
      } finally {
        setSchedulingInterview(false);
      }
    },
    [myEmployeeId, loadData, setSchedulingInterview]
  );

  const handleMoveToOnboarding = useCallback(
    async (candidate: Candidate, branchId: string, joinDate: string) => {
      if (!branchId || !joinDate) return false;
      setMovingToOnboarding(true);
      try {
        const job = jobs.find((j) => j.id === candidate.job_posting_id);
        const nameParts = candidate.full_name.trim().split(" ");
        const isSite = branchId.startsWith("site:");
        const siteObj = isSite ? branches.find((b: any) => b.id === branchId) : null;
        const targetBranchId = isSite ? siteObj?.branch_id : branchId;
        const targetSiteId = isSite ? branchId.substring(5) : null;

        const { error: empErr } = await supabase.from("employees").insert({
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
        });
        if (empErr) throw empErr;

        await supabase.from("candidates").update({ stage: "hired" }).eq("id", candidate.id);
        toast("Moved to Onboarding", `${candidate.full_name} is now onboarding.`, "success");
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to move candidate.", "error");
        return false;
      } finally {
        setMovingToOnboarding(false);
      }
    },
    [jobs, branches, loadData, setMovingToOnboarding]
  );

  const handleSaveFeedback = useCallback(
    async (interview: Interview, score: number, notes: string) => {
      setSavingFeedback(true);
      try {
        const { error } = await supabase.from("interviews").update({ score, feedback: notes || null, status: "completed" }).eq("id", interview.id);
        if (error) throw error;
        toast("Feedback Submitted", "Interview feedback recorded.", "success");
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save feedback.", "error");
        return false;
      } finally {
        setSavingFeedback(false);
      }
    },
    [loadData, setSavingFeedback]
  );

  return {
    uploadCandidateResume,
    handleSaveCandidate,
    handleSaveInterview,
    handleMoveToOnboarding,
    handleSaveFeedback,
  };
}
