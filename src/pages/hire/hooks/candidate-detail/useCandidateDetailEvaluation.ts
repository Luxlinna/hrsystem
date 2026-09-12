import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Candidate, Interview, CandidateDocument } from "../../types";
import { STAGE_CONFIG } from "../../constants";
import { getStageInterview } from "../../constants/evidenceConfig";
import { notifyInterviewScheduledOrCompleted } from "../../services/notifications/recruitmentEventTriggers";
import { parseInterviewPanelFromNotes, isUserInvitedToInterview } from "../../utils/interviewPanelHelper";

interface UseCandidateDetailEvaluationProps {
  id: string | undefined;
  candidate: Candidate | null;
  interviews: Interview[];
  myEmployeeId?: string | null;
  actorName: string;
  roleName?: string;
  isAdminOrRecruiter: boolean;
  loadCandidate: (cid: string) => Promise<void>;
  setCandidate: React.Dispatch<React.SetStateAction<Candidate | null>>;
  setNewInterview: (data: any) => void;
  setScheduleModal: (open: boolean) => void;
}

export function useCandidateDetailEvaluation({
  id,
  candidate,
  interviews,
  myEmployeeId,
  actorName,
  roleName,
  isAdminOrRecruiter,
  loadCandidate,
  setCandidate,
  setNewInterview,
  setScheduleModal,
}: UseCandidateDetailEvaluationProps) {
  const [evaluationModalStage, setEvaluationModalStage] = useState<string | null>(null);
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  const handleSubmitInterviewEvaluation = useCallback(
    async (payload: {
      stageKey: string;
      evaluatorName: string;
      date: string;
      overallScore: number;
      recommendation: "strong_hire" | "advance" | "hold" | "reject";
      competencies: Record<string, number>;
      strengths: string;
      concerns: string;
      notes: string;
      interviewId?: string;
    }) => {
      if (!id || !candidate) return;
      setSubmittingEvaluation(true);
      try {
        const stageLabel = STAGE_CONFIG[payload.stageKey]?.label || payload.stageKey;
        const compSummary = Object.entries(payload.competencies)
          .map(([k, v]) => `${k}: ${v}/5`)
          .join(", ");
        const recLabel =
          payload.recommendation === "strong_hire"
            ? "Strong Hire"
            : payload.recommendation === "advance"
            ? "Advance to Next Round"
            : payload.recommendation === "hold"
            ? "On Hold"
            : "Do Not Proceed";

        const formattedFeedback = [
          `[EVALUATION FORM: ${stageLabel}]`,
          `Evaluator: ${payload.evaluatorName}`,
          `Date: ${payload.date}`,
          `Recommendation: ${recLabel}`,
          `Score: ${payload.overallScore}/5`,
          `Competencies: ${compSummary}`,
          payload.strengths ? `Strengths: ${payload.strengths}` : null,
          payload.concerns ? `Concerns: ${payload.concerns}` : null,
          `Remarks: ${payload.notes}`,
        ]
          .filter(Boolean)
          .join("\n");

        const existingIv = payload.interviewId
          ? interviews.find((i) => i.id === payload.interviewId)
          : getStageInterview(payload.stageKey, interviews);

        const canFeedback = isUserInvitedToInterview({
          interview: existingIv,
          candidate,
          myEmployeeId,
          actorName,
          isAdminOrRecruiter,
        });

        if (!canFeedback) {
          toast("Access Restricted", "You can only feedback candidates that the recruiter invited you to interview.", "error");
          return;
        }

        if (existingIv) {
          await supabase
            .from("interviews")
            .update({
              score: payload.overallScore,
              feedback: formattedFeedback,
              status: "completed",
            })
            .eq("id", existingIv.id);
        } else {
          await supabase.from("interviews").insert({
            candidate_id: id,
            interviewer_id:
              myEmployeeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(myEmployeeId)
                ? myEmployeeId
                : null,
            scheduled_at: new Date(payload.date).toISOString(),
            duration_minutes: 60,
            type: "video",
            score: payload.overallScore,
            feedback: formattedFeedback,
            status: "completed",
            notes: `[Stage: ${payload.stageKey}] Evaluation submitted by ${payload.evaluatorName}`,
          });
        }

        const newEvidenceDoc: CandidateDocument = {
          name: `${stageLabel} - Evaluation Form`,
          url: `#evaluation-${payload.stageKey}`,
          size: 1024,
          type: "application/pdf",
          uploaded_at: new Date().toISOString(),
          stage_key: payload.stageKey,
          notes: `Score: ${payload.overallScore}/5 • Rec: ${recLabel} • Evaluator: ${payload.evaluatorName}`,
        };

        const existingDocs = (candidate.documents || []).filter((d) => d.stage_key !== payload.stageKey);
        const updatedDocs = [...existingDocs, newEvidenceDoc];

        await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", id);

        setCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
        toast("Evaluation Form Recorded", `${stageLabel} evaluation verified and attached to stage evidence.`, "success");

        logActivity({
          module: "hire",
          action: "updated",
          entityType: "candidate",
          entityId: id,
          actorName,
          actorRole: roleName || "Unknown",
          description: `Submitted ${stageLabel} evaluation form for ${candidate.full_name} (${recLabel})`,
        });

        // Notifications
        const panelInfo = existingIv?.notes ? parseInterviewPanelFromNotes(existingIv.notes) : null;
        const panelIds = panelInfo?.panelIds?.length ? panelInfo.panelIds : existingIv?.interviewer_id ? [existingIv.interviewer_id] : [];
        const panelNames = panelInfo?.panelMembers?.length
          ? panelInfo.panelMembers.map((m) => m.name)
          : existingIv?.employees
          ? [`${existingIv.employees.first_name} ${existingIv.employees.last_name}`.trim()]
          : [payload.evaluatorName];

        await notifyInterviewScheduledOrCompleted({
          isCompleted: true,
          candidateName: candidate.full_name,
          candidateId: id,
          jobTitle: candidate.job_postings?.title || "Requisition",
          interviewType: existingIv?.type || "Interview",
          actorName: payload.evaluatorName || actorName,
          score: payload.overallScore,
          recruiterEmployeeId: candidate.assigned_recruiter_id || null,
          recruiterName: candidate.assigned_recruiter ? `${candidate.assigned_recruiter.first_name} ${candidate.assigned_recruiter.last_name}` : null,
          interviewerEmployeeId: existingIv?.interviewer_id || null,
          interviewerName: payload.evaluatorName || panelNames[0] || null,
          interviewerEmployeeIds: panelIds,
          interviewerNames: panelNames,
        });

        setEvaluationModalStage(null);
        await loadCandidate(id);
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit evaluation form", "error");
      } finally {
        setSubmittingEvaluation(false);
      }
    },
    [id, candidate, interviews, myEmployeeId, actorName, roleName, isAdminOrRecruiter, loadCandidate, setCandidate]
  );

  const openScheduleStageModal = useCallback(
    (stageKey: string) => {
      setNewInterview({
        candidate_id: id || "",
        scheduled_at: "",
        duration_minutes: "60",
        type: "video",
        notes: `[Stage: ${stageKey}]`,
      });
      setScheduleModal(true);
    },
    [id, setNewInterview, setScheduleModal]
  );

  return {
    evaluationModalStage,
    setEvaluationModalStage,
    submittingEvaluation,
    handleSubmitInterviewEvaluation,
    openScheduleStageModal,
  };
}
