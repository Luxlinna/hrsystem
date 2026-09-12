import { useCallback } from "react";
import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { startOnboardingForCandidate } from "@/lib/onboarding";
import { STAGE_CONFIG } from "../../constants";
import { checkInterviewStageProgressionGate } from "../../constants/evidenceConfig";
import type { Candidate, Interview } from "../../types";

interface UseCandidateDetailStageActionsProps {
  id: string | undefined;
  candidate: Candidate | null;
  interviews: Interview[];
  actorName: string;
  roleName?: string;
  navigate: NavigateFunction;
  loadCandidate: (cid: string) => Promise<void>;
  setCandidate: React.Dispatch<React.SetStateAction<Candidate | null>>;
  setIsEditingNotes: (editing: boolean) => void;
  setSavingNotes: (saving: boolean) => void;
  notesText: string;
}

export function useCandidateDetailStageActions({
  id,
  candidate,
  interviews,
  actorName,
  roleName,
  navigate,
  loadCandidate,
  setCandidate,
  setIsEditingNotes,
  setSavingNotes,
  notesText,
}: UseCandidateDetailStageActionsProps) {
  const updateStage = useCallback(
    async (stage: string) => {
      if (!id || !candidate) return;

      const gate = checkInterviewStageProgressionGate(candidate.stage, stage, candidate, interviews);
      if (!gate.allowed) {
        toast(
          "Stage Transition Blocked",
          gate.reason || "Both Interview Schedule and Evaluation forms must be completed before moving forward.",
          "warning"
        );
        return;
      }

      const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
      if (error) {
        console.error("Failed to update candidate stage:", error);
        toast("Error", `Failed to update candidate stage: ${error.message || "Unknown error"}`, "error");
        return;
      }
      setCandidate((prev) => (prev ? { ...prev, stage } : prev));

      if (stage === "hired") {
        try {
          const { error: obErr } = await startOnboardingForCandidate(id, actorName);
          if (obErr) {
            console.error("Failed to create onboarding request:", obErr);
            toast("Warning", "Stage updated to Hired, but onboarding enrollment encountered an issue: " + (obErr.message || "Unknown error"), "warning");
          } else {
            toast("Enrolled in Onboarding", `${candidate.full_name} is now officially enrolled in the Onboarding pipeline.`, "success");
          }
        } catch (err: any) {
          console.error("Failed to enroll in onboarding:", err);
        }
      } else {
        toast("Stage Updated", `Candidate moved to ${STAGE_CONFIG[stage]?.label || stage}.`, "success");
      }

      logActivity({
        module: "hire",
        action: stage === "hired" ? "processed" : stage === "rejected" ? "rejected" : "updated",
        entityType: "candidate",
        entityId: id,
        actorName,
        actorRole: roleName || "Unknown",
        description: `${candidate.full_name} moved to ${STAGE_CONFIG[stage]?.label || stage}`,
      });
    },
    [id, candidate, interviews, actorName, roleName, setCandidate]
  );

  const rateCandidate = useCallback(
    async (star: number) => {
      if (!id) return;
      const { error } = await supabase.from("candidates").update({ rating: star }).eq("id", id);
      if (error) {
        toast("Error", "Failed to save rating", "error");
        return;
      }
      setCandidate((prev) => (prev ? { ...prev, rating: star } : prev));
      toast("Rating Saved", `${star}/5 stars recorded.`, "success");
    },
    [id, setCandidate]
  );

  const handleSaveNotes = useCallback(async () => {
    if (!id) return;
    setSavingNotes(true);
    const { error } = await supabase.from("candidates").update({ notes: notesText.trim() }).eq("id", id);
    setSavingNotes(false);
    if (error) {
      toast("Error", "Failed to save notes", "error");
      return;
    }
    setCandidate((prev) => (prev ? { ...prev, notes: notesText.trim() } : prev));
    setIsEditingNotes(false);
    toast("Notes Saved", "Candidate recruiter notes updated.", "success");
  }, [id, notesText, setCandidate, setIsEditingNotes, setSavingNotes]);

  const deleteCandidate = useCallback(async () => {
    if (!id || !candidate) return;
    const { error } = await supabase.from("candidates").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast("Error", "Failed to delete candidate", "error");
      return;
    }
    toast("Candidate Deleted", `${candidate.full_name} was removed.`, "success");
    navigate("/hire");
  }, [id, candidate, navigate]);

  const handleAddApplication = useCallback(
    async (jobPostingId: string, source?: string, notes?: string) => {
      if (!id) return false;
      try {
        const { error } = await supabase.from("candidate_applications").insert({
          candidate_id: id,
          job_posting_id: jobPostingId,
          stage: candidate?.stage || "cv_received",
          source: source || candidate?.source || "Direct",
          outcome: "in_progress",
          notes: notes || null,
        });
        if (error) throw error;
        toast("Application Created", "Candidate added to new vacancy pipeline.", "success");
        await loadCandidate(id);
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to create application", "error");
        return false;
      }
    },
    [id, candidate, loadCandidate]
  );

  return {
    updateStage,
    rateCandidate,
    handleSaveNotes,
    deleteCandidate,
    handleAddApplication,
  };
}
