import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { startOnboardingForCandidate } from "@/lib/onboarding";
import type { Candidate, Job, Interview } from "../types";
import { executeSaveJob } from "../utils/jobSaveHelper";
import { dispatchCandidateStageNotification } from "../utils/candidateStageNotificationHelper";

interface UseHireActionsProps {
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
  branches: any[];
  jobs: Job[];
}

export function useHireActions({
  actorName,
  actorRole,
  loadData,
  branches,
  jobs,
}: UseHireActionsProps) {
  const [postingJob, setPostingJob] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [movingToOnboarding, setMovingToOnboarding] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);

  const handleSaveJob = useCallback(
    async (jobForm: any, editingJob: Job | null) => {
      setPostingJob(true);
      try {
        const ok = await executeSaveJob(jobForm, editingJob, branches);
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save job posting.", "error");
        return false;
      } finally {
        setPostingJob(false);
      }
    },
    [loadData, branches]
  );

  const closeJob = useCallback(
    async (jobOrId: Job | string) => {
      const id = typeof jobOrId === "string" ? jobOrId : jobOrId?.id;
      if (!id) return;
      const { error } = await supabase.from("job_postings").update({ status: "closed" }).eq("id", id);
      if (error) {
        toast("Error", "Failed to close job posting.", "error");
        return;
      }
      toast("Job Closed", "Job posting has been closed.", "info");
      await loadData();
    },
    [loadData]
  );

  const reopenJob = useCallback(
    async (jobOrId: Job | string) => {
      try {
        const id = typeof jobOrId === "string" ? jobOrId : jobOrId?.id;
        if (!id) return;
        const { error } = await supabase.from("job_postings").update({ status: "active" }).eq("id", id);
        if (error) throw error;
        toast("Job Reopened", "Job posting is now open.", "success");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to reopen job.", "error");
      }
    },
    [loadData]
  );

  const deleteJob = useCallback(
    async (jobOrId: Job | string, maybeTitle?: string) => {
      const id = typeof jobOrId === "string" ? jobOrId : jobOrId?.id;
      const title = typeof jobOrId === "string" ? (maybeTitle || "this job posting") : (jobOrId?.title || "this job posting");
      if (!id) return;
      if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
      try {
        const { error } = await supabase
          .from("job_postings")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        toast("Job Deleted", `"${title}" moved to trash.`, "success");
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete job.", "error");
      }
    },
    [loadData]
  );

  const updateCandidateStage = useCallback(async (candidateId: string, stage: string) => {
    try {
      const { error } = await supabase.from("candidates").update({ stage }).eq("id", candidateId);
      if (error) throw error;
      if (stage === "hired") {
        await startOnboardingForCandidate(candidateId, actorName);
        toast("Enrolled in Onboarding", "Candidate moved to Hired and enrolled in Onboarding pipeline.", "success");
      } else {
        toast("Stage Updated", `Candidate moved to ${stage}.`, "success");
      }

      // Canonical Notification Engine Dispatch
      await dispatchCandidateStageNotification({
        candidateId,
        stage,
        actorName,
        actorRole,
      });

      await loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to update stage.", "error");
    }
  }, [loadData, actorName, actorRole]);

  const rateCandidate = useCallback(async (candidateId: string, rating: number) => {
    try {
      const { error } = await supabase.from("candidates").update({ rating }).eq("id", candidateId);
      if (error) throw error;
      toast("Rating Saved", `Candidate rated ${rating} stars.`, "success");
      await loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to rate candidate.", "error");
    }
  }, [loadData]);

  const deleteCandidate = useCallback(async (cOrId: Candidate | string, maybeName?: string) => {
    const id = typeof cOrId === "string" ? cOrId : cOrId?.id;
    const name = typeof cOrId === "string" ? (maybeName || "Candidate") : cOrId?.full_name;
    if (!id) return;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from("candidates").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      toast("Candidate Deleted", `"${name}" moved to trash.`, "success");
      await loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete candidate.", "error");
    }
  }, [loadData]);

  const deleteInterview = useCallback(async (iv: Interview) => {
    if (!confirm("Are you sure you want to cancel and delete this interview?")) return;
    try {
      const { error } = await supabase.from("interviews").update({ deleted_at: new Date().toISOString() }).eq("id", iv.id);
      if (error) throw error;
      toast("Interview Cancelled", "Interview removed.", "success");
      await loadData();
    } catch (err: any) {
      toast("Error", err.message || "Failed to delete interview.", "error");
    }
  }, [loadData]);

  return {
    postingJob,
    uploadingResume,
    setUploadingResume,
    schedulingInterview,
    setSchedulingInterview,
    movingToOnboarding,
    setMovingToOnboarding,
    savingFeedback,
    setSavingFeedback,
    handleSaveJob,
    closeJob,
    reopenJob,
    deleteJob,
    updateCandidateStage,
    rateCandidate,
    deleteCandidate,
    deleteInterview,
  };
}
