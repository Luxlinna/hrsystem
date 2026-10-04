import { useCallback } from "react";
import { toast } from "@/components/Toast";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { Candidate, Job, Interview, NewCandidateFormState } from "../types";
import { executeSaveInterview, executeSaveFeedback, executeSaveInterviewEvaluation } from "./candidateInterviewActions";
import { executeMoveToOnboarding } from "./candidateOnboardingActions";
import { executeMergeCandidate } from "./candidateMergeActions";
import { executeSaveCandidate } from "./candidateSaveActions";

interface UseHireCandidateActionsProps {
  actorName: string;
  actorRole: string;
  myEmployeeId?: string;
  isAdminOrRecruiter?: boolean;
  loadData: () => Promise<void>;
  branches: any[];
  jobs: Job[];
  candidates?: Candidate[];
  setUploadingResume: (val: boolean) => void;
  setSchedulingInterview: (val: boolean) => void;
  setMovingToOnboarding: (val: boolean) => void;
  setSavingFeedback: (val: boolean) => void;
}

export function useHireCandidateActions({
  actorName,
  myEmployeeId,
  isAdminOrRecruiter,
  loadData,
  branches,
  jobs,
  candidates = [],
  setUploadingResume,
  setSchedulingInterview,
  setMovingToOnboarding,
  setSavingFeedback,
}: UseHireCandidateActionsProps) {
  const uploadCandidateResume = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadingResume(true);
      try {
        const item = await uploadFileToS3(file, "candidates/resumes");
        return item.url;
      } catch (err: any) {
        toast("AWS S3 Upload Error", err.message || "Failed to upload resume to AWS S3.", "error");
        return null;
      } finally {
        setUploadingResume(false);
      }
    },
    [setUploadingResume]
  );

  const handleSaveCandidate = useCallback(
    async (candidateForm: any, editingCandidate: Candidate | null, filesToUpload?: File[] | File | null) => {
      setUploadingResume(true);
      try {
        const ok = await executeSaveCandidate({ candidateForm, editingCandidate, filesToUpload, jobs });
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save candidate.", "error");
        return false;
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData, setUploadingResume, jobs]
  );

  const handleSaveInterview = useCallback(
    async (interviewForm: any, editingInterview: Interview | null) => {
      setSchedulingInterview(true);
      try {
        const ok = await executeSaveInterview({ interviewForm, editingInterview, myEmployeeId, actorName, candidates, jobs });
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to schedule interview.", "error");
        return false;
      } finally {
        setSchedulingInterview(false);
      }
    },
    [myEmployeeId, actorName, candidates, jobs, loadData, setSchedulingInterview]
  );

  const handleMoveToOnboarding = useCallback(
    async (candidate: Candidate, branchId: string, joinDate: string) => {
      setMovingToOnboarding(true);
      try {
        const ok = await executeMoveToOnboarding({ candidate, branchId, joinDate, actorName, jobs, branches });
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to move candidate to onboarding.", "error");
        return false;
      } finally {
        setMovingToOnboarding(false);
      }
    },
    [jobs, branches, actorName, loadData, setMovingToOnboarding]
  );

  const handleSaveFeedback = useCallback(
    async (interview: Interview, score: number, notes: string) => {
      setSavingFeedback(true);
      try {
        const ok = await executeSaveFeedback({
          interview,
          score,
          notes,
          actorName,
          myEmployeeId,
          isAdminOrRecruiter,
          candidates,
          jobs,
        });
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save feedback.", "error");
        return false;
      } finally {
        setSavingFeedback(false);
      }
    },
    [actorName, myEmployeeId, isAdminOrRecruiter, candidates, jobs, loadData, setSavingFeedback]
  );

  const handleSaveInterviewEvaluation = useCallback(
    async (payload: any, interview?: Interview | null) => {
      setSavingFeedback(true);
      try {
        const ok = await executeSaveInterviewEvaluation({
          payload,
          actorName,
          myEmployeeId,
          isAdminOrRecruiter,
          candidates,
          jobs,
          interview: interview || null,
        });
        if (ok) await loadData();
        return ok;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save evaluation.", "error");
        return false;
      } finally {
        setSavingFeedback(false);
      }
    },
    [actorName, myEmployeeId, isAdminOrRecruiter, candidates, jobs, loadData, setSavingFeedback]
  );

  const handleMergeCandidate = useCallback(
    async (existingCandidateId: string, candidateForm: NewCandidateFormState, candidateFiles: File[] = []): Promise<boolean> => {
      setUploadingResume(true);
      try {
        const ok = await executeMergeCandidate(existingCandidateId, candidateForm, candidateFiles);
        if (ok) await loadData();
        return ok;
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData, setUploadingResume]
  );

  return {
    uploadCandidateResume,
    handleSaveCandidate,
    handleSaveInterview,
    handleMoveToOnboarding,
    handleSaveFeedback,
    handleSaveInterviewEvaluation,
    handleMergeCandidate,
  };
}
