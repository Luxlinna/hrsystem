import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { logActivity } from "@/lib/audit";
import { uploadFileToS3, uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import type { Candidate, Interview, CandidateDocument, Job } from "../types";
import { STAGE_CONFIG } from "../constants";
import { checkInterviewStageProgressionGate, getStageInterview } from "../constants/evidenceConfig";
import { useCandidateDetailFeedback } from "./useCandidateDetailFeedback";
import { startOnboardingForCandidate } from "@/lib/onboarding";

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
  const [uploadingResume, setUploadingResume] = useState(false);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadRequestId = useRef(0);

  const loadCandidate = useCallback(async (cid: string) => {
    setLoading(true);
    const requestId = ++loadRequestId.current;
    const [{ data: c }, { data: ivs }, { data: apps }, { data: j }] = await Promise.all([
      supabase
        .from("candidates")
        .select("*, job_postings(id, title, department, branches(name)), assigned_recruiter:employees!assigned_recruiter_id(id, first_name, last_name, email)")
        .eq("id", cid)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("interviews")
        .select("*, employees(first_name, last_name, avatar_url)")
        .eq("candidate_id", cid)
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("candidate_applications")
        .select("*, job_postings(id, title, department, location, branches(name))")
        .eq("candidate_id", cid)
        .order("applied_at", { ascending: false }),
      supabase
        .from("job_postings")
        .select("id, title, department, location")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("title"),
    ]);

    if (requestId !== loadRequestId.current) return;
    const cand = c as unknown as Candidate | null;
    if (cand) {
      cand.applications = (apps as any) || [];
    }
    setCandidate(cand);
    setJobs((j as unknown as Job[]) || []);
    if (cand) setNotesText(cand.notes || "");
    setInterviews((ivs as unknown as Interview[]) || []);
    setLoading(false);
  }, []);

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

  const updateStage = useCallback(
    async (stage: string) => {
      if (!id || !candidate) return;

      // Enforce Interview Stage progression gate: both Interview Schedule Form & Evaluation Form must be complete
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
        toast("Error", "Failed to update candidate stage", "error");
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
        actorRole: role?.name || "Unknown",
        description: `${candidate.full_name} moved to ${STAGE_CONFIG[stage]?.label || stage}`,
      });
    },
    [id, candidate, interviews, actorName, role?.name]
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
    [id]
  );

  const uploadDocuments = useCallback(
    async (files: File[]) => {
      if (!id || files.length === 0) return;
      setUploadingResume(true);
      try {
        const s3Items = await uploadMultipleFilesToS3(files, "candidates/documents");
        const newDocs: CandidateDocument[] = s3Items.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
        }));

        const existingDocs: CandidateDocument[] = candidate?.documents || (
          candidate?.resume_url
            ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url }]
            : []
        );

        const allDocs = [...existingDocs, ...newDocs];
        const primaryDoc = allDocs[0] || null;

        const { error } = await supabase.from("candidates").update({
          documents: allDocs,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        }).eq("id", id);

        if (error) throw error;

        setCandidate((prev) => (prev ? {
          ...prev,
          documents: allDocs,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        } : prev));

        toast("Files Uploaded", `${files.length} document(s) saved to AWS S3.`, "success");
      } catch (err) {
        console.error("Upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : (err as any)?.message || "Could not upload documents", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [id, candidate]
  );

  const uploadResume = useCallback(
    async (file: File) => {
      await uploadDocuments([file]);
    },
    [uploadDocuments]
  );

  const uploadStageEvidence = useCallback(
    async (stageKey: string, file: File) => {
      if (!id) return;
      setUploadingResume(true);
      try {
        const s3Items = await uploadMultipleFilesToS3([file], `candidates/evidence/${stageKey}`);
        const uploadedItem = s3Items[0];
        if (!uploadedItem) throw new Error("File upload returned no data");

        const newDoc: CandidateDocument = {
          name: uploadedItem.name,
          url: uploadedItem.url,
          size: uploadedItem.size,
          type: uploadedItem.type,
          uploaded_at: new Date().toISOString(),
          stage_key: stageKey,
        };

        const existingDocs: CandidateDocument[] = candidate?.documents || (
          candidate?.resume_url
            ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url, stage_key: "cv_received" }]
            : []
        );

        const allDocs = [...existingDocs, newDoc];

        const { error } = await supabase.from("candidates").update({
          documents: allDocs,
        }).eq("id", id);

        if (error) throw error;

        setCandidate((prev) => (prev ? {
          ...prev,
          documents: allDocs,
        } : prev));

        toast("Evidence Uploaded", `Document attached to "${stageKey}" stage.`, "success");
      } catch (err: any) {
        console.error("Evidence upload error:", err);
        toast("Upload Failed", err?.message || "Failed to upload stage evidence", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [id, candidate]
  );

  const deleteDocument = useCallback(
    async (docUrl: string) => {
      if (!id || !candidate) return;
      const currentDocs = candidate.documents || (
        candidate.resume_url
          ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url }]
          : []
      );
      const remaining = currentDocs.filter((d) => d.url !== docUrl);
      const primaryDoc = remaining[0] || null;

      try {
        const { error } = await supabase.from("candidates").update({
          documents: remaining,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        }).eq("id", id);

        if (error) throw error;

        setCandidate((prev) => (prev ? {
          ...prev,
          documents: remaining,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        } : prev));

        toast("Document Removed", "File removed from candidate profile.", "success");
      } catch (err: any) {
        toast("Error", err?.message || "Could not remove file", "error");
      }
    },
    [id, candidate]
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
  }, [id, notesText]);

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

        // 1. Create or update the interview record
        const existingIv = getStageInterview(payload.stageKey, interviews);

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
            interviewer_id: myEmployee?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(myEmployee.id) ? myEmployee.id : null,
            scheduled_at: new Date(payload.date).toISOString(),
            duration_minutes: 60,
            type: "video",
            score: payload.overallScore,
            feedback: formattedFeedback,
            status: "completed",
            notes: `[Stage: ${payload.stageKey}] Evaluation submitted by ${payload.evaluatorName}`,
          });
        }

        // 2. Generate and attach formal evidence document to candidate.documents
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

        const { error: candErr } = await supabase
          .from("candidates")
          .update({
            documents: updatedDocs,
          })
          .eq("id", id);

        if (candErr) {
          console.error("Failed to update candidate documents:", candErr);
        }

        setCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
        toast(
          "Evaluation Form Recorded",
          `${stageLabel} evaluation verified and attached to stage evidence.`,
          "success"
        );

        logActivity({
          module: "hire",
          action: "updated",
          entityType: "candidate",
          entityId: id,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `Submitted ${stageLabel} evaluation form for ${candidate.full_name} (${recLabel})`,
        });

        setEvaluationModalStage(null);
        await loadCandidate(id);
      } catch (err: any) {
        toast("Error", err.message || "Failed to submit evaluation form", "error");
      } finally {
        setSubmittingEvaluation(false);
      }
    },
    [id, candidate, interviews, myEmployee?.id, actorName, role?.name, loadCandidate]
  );

  const openScheduleStageModal = useCallback(
    (stageKey: string) => {
      feedback.setNewInterview({
        candidate_id: id || "",
        scheduled_at: "",
        duration_minutes: "60",
        type: "video",
        notes: `[Stage: ${stageKey}]`,
      });
      feedback.setScheduleModal(true);
    },
    [id, feedback]
  );

  return {
    candidate,
    interviews,
    loading,
    uploadingResume,
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
    fileInputRef,
    openScheduleModal: feedback.openScheduleModal,
    openScheduleStageModal,
    updateStage,
    rateCandidate,
    uploadResume,
    uploadDocuments,
    uploadStageEvidence,
    deleteDocument,
    handleSaveNotes,
    deleteCandidate,
    handleAddApplication,
    jobs,
    handleScheduleInterview: feedback.handleScheduleInterview,
    handleSaveFeedback: feedback.handleSaveFeedback,
    evaluationModalStage,
    setEvaluationModalStage,
    submittingEvaluation,
    handleSubmitInterviewEvaluation,
    actorName,
    navigate,
  };
}
