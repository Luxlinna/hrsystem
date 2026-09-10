import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, NewInterviewFormState } from "../types";

interface UseCandidateDetailFeedbackProps {
  candidateId?: string;
  actorName: string;
  myEmployeeId?: string;
  loadCandidate: (cid: string) => Promise<void>;
}

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export function useCandidateDetailFeedback({
  candidateId,
  actorName,
  myEmployeeId,
  loadCandidate,
}: UseCandidateDetailFeedbackProps) {
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);

  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [newInterview, setNewInterview] = useState<NewInterviewFormState>({
    candidate_id: "",
    scheduled_at: "",
    duration_minutes: "60",
    type: "video",
    notes: "",
  });

  const openFeedbackModal = useCallback((iv: Interview) => {
    setFeedbackInterview(iv);
    setFeedbackScore(iv.score || 5);
    setFeedbackText(iv.feedback || "");
    setFeedbackModal(true);
  }, []);

  const openScheduleModal = useCallback(() => {
    setNewInterview({
      candidate_id: candidateId || "",
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
      const targetCandidateId = candidateId || newInterview.candidate_id;
      if (!targetCandidateId || !newInterview.scheduled_at) {
        toast("Validation Error", "Please provide a valid candidate and interview date/time.", "error");
        return;
      }
      setSchedulingInterview(true);
      try {
        // Ensure type strictly conforms to DB check constraint ('video' | 'in-person' | 'phone')
        const dbType = ["video", "in-person", "phone"].includes(newInterview.type)
          ? newInterview.type
          : "video";

        const { error } = await supabase.from("interviews").insert({
          candidate_id: targetCandidateId,
          interviewer_id: isUuid(myEmployeeId) ? myEmployeeId : null,
          scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
          duration_minutes: Number(newInterview.duration_minutes) || 60,
          type: dbType,
          notes: newInterview.notes.trim() || null,
          status: "scheduled",
        });

        if (error) {
          console.error("Failed to schedule interview:", error);
          toast("Error", error.message || "Failed to schedule interview", "error");
          return;
        }

        toast("Interview Scheduled", "New interview added to calendar.", "success");
        setScheduleModal(false);
        await loadCandidate(targetCandidateId);
      } catch (err: any) {
        console.error("Exception scheduling interview:", err);
        toast("Error", err.message || "An unexpected error occurred while scheduling", "error");
      } finally {
        setSchedulingInterview(false);
      }
    },
    [candidateId, newInterview, myEmployeeId, loadCandidate]
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
