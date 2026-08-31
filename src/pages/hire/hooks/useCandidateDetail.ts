import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { logActivity } from "@/lib/audit";
import { uploadFileToS3, uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import type { Candidate, Interview, CandidateDocument } from "../types";
import { STAGE_CONFIG } from "../constants";
import { useCandidateDetailFeedback } from "./useCandidateDetailFeedback";

export function useCandidateDetail(id: string | undefined) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { employee: myEmployee } = useMyEmployee();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
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
    const [{ data: c }, { data: ivs }] = await Promise.all([
      supabase.from("candidates").select("*, job_postings(id, title, department, branches(name))").eq("id", cid).is("deleted_at", null).maybeSingle(),
      supabase.from("interviews").select("*, employees(first_name, last_name, avatar_url)").eq("candidate_id", cid).is("deleted_at", null).order("scheduled_at", { ascending: false }),
    ]);

    if (requestId !== loadRequestId.current) return;
    const cand = c as unknown as Candidate | null;
    setCandidate(cand);
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
      const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
      if (error) {
        toast("Error", "Failed to update candidate stage", "error");
        return;
      }
      setCandidate((prev) => (prev ? { ...prev, stage } : prev));
      toast("Stage Updated", `Candidate moved to ${STAGE_CONFIG[stage]?.label || stage}.`, "success");
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
    [id, candidate, actorName, role?.name]
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

        await supabase.from("candidates").update({
          documents: allDocs,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        }).eq("id", id);

        setCandidate((prev) => (prev ? {
          ...prev,
          documents: allDocs,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        } : prev));

        toast("Files Uploaded", `${files.length} document(s) saved to AWS S3.`, "success");
      } catch (err) {
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload documents to AWS S3", "error");
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
        await supabase.from("candidates").update({
          documents: remaining,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        }).eq("id", id);

        setCandidate((prev) => (prev ? {
          ...prev,
          documents: remaining,
          resume_url: primaryDoc?.url || null,
          resume_name: primaryDoc?.name || null,
        } : prev));

        toast("Document Removed", "File removed from candidate profile.", "success");
      } catch (err) {
        toast("Error", "Could not remove file", "error");
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
    updateStage,
    rateCandidate,
    uploadResume,
    uploadDocuments,
    deleteDocument,
    handleSaveNotes,
    deleteCandidate,
    handleScheduleInterview: feedback.handleScheduleInterview,
    handleSaveFeedback: feedback.handleSaveFeedback,
    navigate,
  };
}
