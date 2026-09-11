import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Interview, NewInterviewFormState } from "../types";
import { notifyInterviewScheduledOrCompleted } from "../services/notifications/recruitmentEventTriggers";

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
      interviewer_id: "",
      interviewer_name: "",
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
        const dbType = ["video", "in-person", "phone"].includes(newInterview.type)
          ? newInterview.type
          : "video";

        const selectedInterviewerId = isUuid(newInterview.interviewer_id)
          ? newInterview.interviewer_id
          : isUuid(myEmployeeId)
          ? myEmployeeId
          : null;

        const { error } = await supabase.from("interviews").insert({
          candidate_id: targetCandidateId,
          interviewer_id: selectedInterviewerId,
          scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
          duration_minutes: Number(newInterview.duration_minutes) || 60,
          type: dbType,
          notes: newInterview.notes.trim() || null,
          status: "scheduled",
        });

        if (error) throw error;

        // Standing notification: Interviewer / Hiring Manager + Assigned Recruiter
        const { data: candInfo } = await supabase
          .from("candidates")
          .select("full_name, assigned_recruiter_id, job_postings(title)")
          .eq("id", targetCandidateId)
          .maybeSingle();

        if (candInfo) {
          const panelIds = newInterview.interviewer_ids || (selectedInterviewerId ? [selectedInterviewerId] : []);
          const panelNames = newInterview.interviewer_names || (newInterview.interviewer_name ? [newInterview.interviewer_name] : []);

          await notifyInterviewScheduledOrCompleted({
            isCompleted: false,
            candidateName: candInfo.full_name,
            candidateId: targetCandidateId,
            jobTitle: (candInfo.job_postings as any)?.title || "Open Position",
            interviewType: dbType,
            actorName,
            scheduledAt: new Date(newInterview.scheduled_at).toISOString(),
            recruiterEmployeeId: candInfo.assigned_recruiter_id || null,
            interviewerEmployeeId: selectedInterviewerId,
            interviewerName: newInterview.interviewer_name || null,
            interviewerEmployeeIds: panelIds,
            interviewerNames: panelNames,
          });
        }

        toast("Interview Scheduled", "New interview added to calendar.", "success");
        setScheduleModal(false);
        await loadCandidate(targetCandidateId);
      } catch (err: any) {
        toast("Error", err.message || "Failed to schedule interview", "error");
      } finally {
        setSchedulingInterview(false);
      }
    },
    [candidateId, newInterview, myEmployeeId, actorName, loadCandidate]
  );

  const handleSaveFeedback = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!feedbackInterview || !candidateId) return;
      setSavingFeedback(true);
      try {
        const { error } = await supabase
          .from("interviews")
          .update({
            score: feedbackScore,
            feedback: feedbackText.trim() || null,
            status: "completed",
          })
          .eq("id", feedbackInterview.id);

        if (error) throw error;

        // Standing notification: Interview feedback submitted
        const { data: candInfo } = await supabase
          .from("candidates")
          .select("full_name, assigned_recruiter_id, job_postings(title)")
          .eq("id", candidateId)
          .maybeSingle();

        if (candInfo) {
          const panelMatch = (feedbackInterview.notes || "").match(/\[Panel:\s*(.*?)\]/i);
          const fbNames = panelMatch
            ? panelMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
            : feedbackInterview.employees
            ? [`${feedbackInterview.employees.first_name} ${feedbackInterview.employees.last_name}`.trim()]
            : [];
          const panelIdsMatch = (feedbackInterview.notes || "").match(/\[PanelIds:\s*(.*?)\]/i);
          const fbIds = panelIdsMatch
            ? panelIdsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
            : feedbackInterview.interviewer_id
            ? [feedbackInterview.interviewer_id]
            : [];

          await notifyInterviewScheduledOrCompleted({
            isCompleted: true,
            candidateName: candInfo.full_name,
            candidateId,
            jobTitle: (candInfo.job_postings as any)?.title || "Role",
            interviewType: feedbackInterview.type || "Interview",
            actorName,
            score: feedbackScore,
            recruiterEmployeeId: candInfo.assigned_recruiter_id || null,
            interviewerEmployeeId: feedbackInterview.interviewer_id || null,
            interviewerName: fbNames[0] || null,
            interviewerEmployeeIds: fbIds,
            interviewerNames: fbNames,
          });
        }

        toast("Feedback Saved", "Interview scorecard submitted.", "success");
        setFeedbackInterview(null);
        setFeedbackModal(false);
        await loadCandidate(candidateId);
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit feedback", "error");
      } finally {
        setSavingFeedback(false);
      }
    },
    [feedbackInterview, candidateId, feedbackScore, feedbackText, actorName, loadCandidate]
  );

  return {
    feedbackInterview,
    setFeedbackInterview,
    feedbackScore,
    setFeedbackScore,
    feedbackText,
    setFeedbackText,
    savingFeedback,
    feedbackModal,
    setFeedbackModal,
    scheduleModal,
    setScheduleModal,
    schedulingInterview,
    newInterview,
    setNewInterview,
    openScheduleModal,
    openFeedbackModal,
    handleScheduleInterview,
    handleSaveFeedback,
  };
}
