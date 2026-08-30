import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, NewInterviewFormState } from "../types";

interface UseCandidateDetailFeedbackProps {
  candidateId?: string;
  actorName: string;
  loadCandidate: (cid: string) => Promise<void>;
}

export function useCandidateDetailFeedback({
  candidateId,
  actorName,
  loadCandidate,
}: UseCandidateDetailFeedbackProps) {
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [newInterview, setNewInterview] = useState<NewInterviewFormState>({
    candidate_id: "",
    scheduled_at: "",
    duration_minutes: "60",
    type: "video",
    notes: "",
  });

  const openScheduleModal = useCallback(() => {
    if (!candidateId) return;
    setNewInterview({
      candidate_id: candidateId,
      scheduled_at: "",
      duration_minutes: "60",
      type: "video",
      notes: "",
    });
    setScheduleModal(true);
  }, [candidateId]);

  const handleScheduleInterview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!candidateId || !newInterview.scheduled_at) return;
      setSchedulingInterview(true);
      const { error } = await supabase.from("interviews").insert({
        candidate_id: candidateId,
        interviewer_id: actorName,
        scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
        duration_minutes: Number(newInterview.duration_minutes) || 60,
        type: newInterview.type,
        notes: newInterview.notes.trim() || null,
        status: "scheduled",
      });
      setSchedulingInterview(false);
      if (error) {
        toast("Error", "Failed to schedule interview", "error");
        return;
      }
      toast("Interview Scheduled", "New interview added to calendar.", "success");
      setScheduleModal(false);
      loadCandidate(candidateId);
    },
    [candidateId, newInterview, actorName, loadCandidate]
  );

  const handleSaveFeedback = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!feedbackInterview || !candidateId) return;
      setSavingFeedback(true);
      const { error } = await supabase
        .from("interviews")
        .update({
          score: feedbackScore,
          feedback: feedbackText.trim() || null,
          status: "completed",
        })
        .eq("id", feedbackInterview.id);
      setSavingFeedback(false);
      if (error) {
        toast("Error", "Failed to submit feedback", "error");
        return;
      }
      toast("Feedback Saved", "Interview scorecard submitted.", "success");
      setFeedbackInterview(null);
      loadCandidate(candidateId);
    },
    [feedbackInterview, candidateId, feedbackScore, feedbackText, loadCandidate]
  );

  return {
    feedbackInterview,
    setFeedbackInterview,
    feedbackScore,
    setFeedbackScore,
    feedbackText,
    setFeedbackText,
    savingFeedback,
    scheduleModal,
    setScheduleModal,
    schedulingInterview,
    newInterview,
    setNewInterview,
    openScheduleModal,
    handleScheduleInterview,
    handleSaveFeedback,
  };
}
