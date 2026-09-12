import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Candidate, Interview, Job } from "../types";
import { useCandidateDetailFeedback } from "./useCandidateDetailFeedback";
import { fetchCandidateBundle, resolveCandidateIdFallback } from "./candidate-detail/candidateDetailLoader";
import { useCandidateDetailDocuments } from "./candidate-detail/useCandidateDetailDocuments";
import { useCandidateDetailEvaluation } from "./candidate-detail/useCandidateDetailEvaluation";
import { useCandidateDetailStageActions } from "./candidate-detail/useCandidateDetailStageActions";

export function useCandidateDetail(id: string | undefined) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { employee: myEmployee } = useMyEmployee();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const myJobRole = (myEmployee?.role || "").trim().toLowerCase();
  const isAdminOrRecruiter = Boolean(
    role?.is_admin ||
    role?.hiring_requests_hr_admin_approve ||
    role?.hiring_requests_hr_review ||
    role?.hiring_requests_chairman_approve ||
    /(admin|recruiter|talent|hr\s*manager|hr\s*specialist|hr\s*officer|director|ceo)\b/i.test(role?.name || "") ||
    /(admin|recruiter|talent|hr\s*manager|hr\s*specialist|hr\s*officer|director|ceo)\b/i.test(myJobRole) ||
    (candidate?.assigned_recruiter_id && myEmployee?.id && candidate.assigned_recruiter_id === myEmployee.id)
  );

  const loadRequestId = useRef(0);

  const loadCandidate = useCallback(
    async (cid: string) => {
      setLoading(true);
      const requestId = ++loadRequestId.current;

      let bundle = await fetchCandidateBundle(cid);
      if (requestId !== loadRequestId.current) return;

      // Fallback: If not found, ID might be an offer_letter, CAF, or interview ID
      if (!bundle.candidate) {
        const resolvedId = await resolveCandidateIdFallback(cid);
        if (resolvedId && resolvedId !== cid) {
          bundle = await fetchCandidateBundle(resolvedId);
          if (requestId !== loadRequestId.current) return;
          if (bundle.candidate) {
            try {
              navigate(`/hire/candidates/${resolvedId}${window.location.search}`, { replace: true });
            } catch {}
          }
        }
      }

      setCandidate(bundle.candidate);
      setJobs(bundle.jobs);
      setInterviews(bundle.interviews);
      if (bundle.candidate) setNotesText(bundle.candidate.notes || "");
      setLoading(false);
    },
    [navigate]
  );

  useEffect(() => {
    if (!id) return;
    loadCandidate(id);
  }, [id, loadCandidate]);

  const feedback = useCandidateDetailFeedback({
    candidateId: id,
    actorName,
    myEmployeeId: myEmployee?.id,
    loadCandidate,
  });

  const docs = useCandidateDetailDocuments({
    id,
    candidate,
    setCandidate,
  });

  const evalState = useCandidateDetailEvaluation({
    id,
    candidate,
    interviews,
    myEmployeeId: myEmployee?.id,
    actorName,
    roleName: role?.name,
    isAdminOrRecruiter,
    loadCandidate,
    setCandidate,
    setNewInterview: feedback.setNewInterview,
    setScheduleModal: feedback.setScheduleModal,
  });

  const stageActions = useCandidateDetailStageActions({
    id,
    candidate,
    interviews,
    actorName,
    roleName: role?.name,
    navigate,
    loadCandidate,
    setCandidate,
    setIsEditingNotes,
    setSavingNotes,
    notesText,
  });

  return {
    candidate,
    setCandidate,
    interviews,
    loading,
    uploadingResume: docs.uploadingResume,
    isEditingNotes,
    setIsEditingNotes,
    notesText,
    setNotesText,
    savingNotes,
    feedbackInterview: feedback.feedbackInterview,
    setFeedbackInterview: feedback.setFeedbackInterview,
    feedbackScore: feedback.feedbackScore,
    setFeedbackScore: feedback.setFeedbackScore,
    feedbackText: feedback.feedbackText,
    setFeedbackText: feedback.setFeedbackText,
    savingFeedback: feedback.savingFeedback,
    scheduleModal: feedback.scheduleModal,
    setScheduleModal: feedback.setScheduleModal,
    schedulingInterview: feedback.schedulingInterview,
    newInterview: feedback.newInterview,
    setNewInterview: feedback.setNewInterview,
    fileInputRef: docs.fileInputRef,
    openScheduleModal: feedback.openScheduleModal,
    openScheduleStageModal: evalState.openScheduleStageModal,
    updateStage: stageActions.updateStage,
    rateCandidate: stageActions.rateCandidate,
    uploadResume: docs.uploadResume,
    uploadDocuments: docs.uploadDocuments,
    uploadStageEvidence: docs.uploadStageEvidence,
    deleteDocument: docs.deleteDocument,
    handleSaveNotes: stageActions.handleSaveNotes,
    deleteCandidate: stageActions.deleteCandidate,
    handleAddApplication: stageActions.handleAddApplication,
    jobs,
    handleScheduleInterview: feedback.handleScheduleInterview,
    handleSaveFeedback: feedback.handleSaveFeedback,
    evaluationModalStage: evalState.evaluationModalStage,
    setEvaluationModalStage: evalState.setEvaluationModalStage,
    submittingEvaluation: evalState.submittingEvaluation,
    handleSubmitInterviewEvaluation: evalState.handleSubmitInterviewEvaluation,
    actorName,
    isAdminOrRecruiter,
    myEmployeeId: myEmployee?.id,
    navigate,
  };
}
