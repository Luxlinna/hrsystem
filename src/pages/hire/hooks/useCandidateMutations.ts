import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { Job, Candidate } from "../types";
import { STAGE_CONFIG } from "../constants";
import { dispatchCandidateStageNotification } from "../utils/candidateStageNotificationHelper";
import { executeMoveCandidateToOnboarding } from "../utils/candidateOnboardingHelper";

interface UseCandidateMutationsProps {
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
}

export function useCandidateMutations({
  actorName,
  actorRole,
  loadData,
}: UseCandidateMutationsProps) {
  const [movingToOnboarding, setMovingToOnboarding] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const updateCandidateStage = useCallback(
    async (id: string, stage: string) => {
      const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
      if (error) {
        console.error("Failed to update candidate stage:", error);
        toast("Error", `Failed to update candidate stage: ${error.message || "Unknown error"}`, "error");
        return;
      }
      toast("Stage updated", `Candidate moved to ${STAGE_CONFIG[stage]?.label || stage}.`, "success");

      await dispatchCandidateStageNotification({
        candidateId: id,
        stage,
        actorName,
        actorRole,
      });

      loadData();
    },
    [actorName, actorRole, loadData]
  );

  const rateCandidate = useCallback(
    async (id: string, rating: number) => {
      const { error } = await supabase.from("candidates").update({ rating }).eq("id", id);
      if (error) {
        toast("Error", "Failed to save rating", "error");
        return;
      }
      toast("Rating saved", `Candidate rated ${rating}/5.`, "success");
      loadData();
    },
    [loadData]
  );

  const deleteCandidate = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Move candidate "${name}" to Recycle Bin?`)) return;
      const { error } = await supabase
        .from("candidates")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);
      if (error) {
        toast("Error", "Failed to delete candidate", "error");
        return;
      }
      toast("Candidate Deleted", "Candidate sent to Recycle Bin.", "success");
      loadData();
    },
    [actorName, loadData]
  );

  const handleMoveToOnboarding = useCallback(
    async (
      candidate: Candidate,
      branchId: string,
      joinDate: string,
      job?: Job
    ) => {
      if (movingToOnboarding) return false;
      setMovingToOnboarding(true);
      try {
        const ok = await executeMoveCandidateToOnboarding({
          candidate,
          branchId,
          joinDate,
          job,
          actorName,
          actorRole,
        });
        if (ok) loadData();
        return ok;
      } finally {
        setMovingToOnboarding(false);
      }
    },
    [movingToOnboarding, actorName, actorRole, loadData]
  );

  const uploadCandidateResume = useCallback(
    async (candidateId: string, file: File) => {
      setUploadingResume(true);
      try {
        const item = await uploadFileToS3(file, "candidates/resumes");
        
        // Fetch existing documents to append
        const { data: cand } = await supabase.from("candidates").select("documents, resume_url, resume_name").eq("id", candidateId).maybeSingle();
        const existingDocs = (cand as any)?.documents || (
          (cand as any)?.resume_url
            ? [{ name: (cand as any).resume_name || "Resume", url: (cand as any).resume_url }]
            : []
        );
        const newDoc = {
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
        };
        const allDocs = [...existingDocs, newDoc];

        await supabase.from("candidates").update({
          resume_url: item.url,
          resume_name: item.name,
          documents: allDocs,
        }).eq("id", candidateId);

        toast("Resume uploaded", "Resume attached and stored in AWS S3 successfully.", "success");
        loadData();
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume to AWS S3", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData]
  );

  return {
    movingToOnboarding,
    uploadingResume,
    setUploadingResume,
    updateCandidateStage,
    rateCandidate,
    deleteCandidate,
    handleMoveToOnboarding,
    uploadCandidateResume,
  };
}
