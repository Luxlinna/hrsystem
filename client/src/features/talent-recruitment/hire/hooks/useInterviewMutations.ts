import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface UseInterviewMutationsProps {
  actorName: string;
  loadData: () => Promise<void>;
}

export function useInterviewMutations({
  actorName,
  loadData,
}: UseInterviewMutationsProps) {
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [savingFeedback, setSavingFeedback] = useState(false);

  const deleteInterview = useCallback(
    async (id: string) => {
      if (!confirm("Move this interview to Recycle Bin?")) return;
      const { error } = await supabase
        .from("interviews")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);
      if (error) {
        toast("Error", "Failed to delete interview", "error");
        return;
      }
      toast("Interview Deleted", "Interview moved to Recycle Bin.", "success");
      loadData();
    },
    [actorName, loadData]
  );

  const handleSaveFeedback = useCallback(
    async (interviewId: string, feedbackNotes: string, feedbackScore: number) => {
      setSavingFeedback(true);
      const { error } = await supabase
        .from("interviews")
        .update({
          feedback: feedbackNotes.trim(),
          score: feedbackScore,
          status: "completed",
        })
        .eq("id", interviewId);
      setSavingFeedback(false);
      if (error) {
        toast("Error", "Failed to save interview feedback", "error");
        return false;
      }
      toast("Feedback saved", "Interview marked as completed with score recorded.", "success");
      loadData();
      return true;
    },
    [loadData]
  );

  return {
    schedulingInterview,
    setSchedulingInterview,
    savingFeedback,
    deleteInterview,
    handleSaveFeedback,
  };
}
