import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import type { Candidate, CandidateDocument } from "../../types";

interface UseCandidateDetailDocumentsProps {
  id: string | undefined;
  candidate: Candidate | null;
  setCandidate: React.Dispatch<React.SetStateAction<Candidate | null>>;
}

export function useCandidateDetailDocuments({
  id,
  candidate,
  setCandidate,
}: UseCandidateDetailDocumentsProps) {
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        const existingDocs: CandidateDocument[] =
          candidate?.documents ||
          (candidate?.resume_url
            ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url }]
            : []);

        const allDocs = [...existingDocs, ...newDocs];
        const primaryDoc = allDocs[0] || null;

        const { error } = await supabase
          .from("candidates")
          .update({
            documents: allDocs,
            resume_url: primaryDoc?.url || null,
            resume_name: primaryDoc?.name || null,
          })
          .eq("id", id);

        if (error) throw error;

        setCandidate((prev) =>
          prev
            ? {
                ...prev,
                documents: allDocs,
                resume_url: primaryDoc?.url || null,
                resume_name: primaryDoc?.name || null,
              }
            : prev
        );

        toast("Files Uploaded", `${files.length} document(s) saved to AWS S3.`, "success");
      } catch (err) {
        console.error("Upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload documents", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [id, candidate, setCandidate]
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

        const existingDocs: CandidateDocument[] =
          candidate?.documents ||
          (candidate?.resume_url
            ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url, stage_key: "cv_received" }]
            : []);

        const allDocs = [...existingDocs, newDoc];

        const { error } = await supabase
          .from("candidates")
          .update({ documents: allDocs })
          .eq("id", id);

        if (error) throw error;

        setCandidate((prev) => (prev ? { ...prev, documents: allDocs } : prev));
        toast("Evidence Uploaded", `Document attached to "${stageKey}" stage.`, "success");
      } catch (err: any) {
        console.error("Evidence upload error:", err);
        toast("Upload Failed", err?.message || "Failed to upload stage evidence", "error");
      } finally {
        setUploadingResume(false);
      }
    },
    [id, candidate, setCandidate]
  );

  const deleteDocument = useCallback(
    async (docUrl: string) => {
      if (!id || !candidate) return;
      const currentDocs =
        candidate.documents ||
        (candidate.resume_url ? [{ name: candidate.resume_name || "Resume", url: candidate.resume_url }] : []);
      const remaining = currentDocs.filter((d) => d.url !== docUrl);
      const primaryDoc = remaining[0] || null;

      try {
        const { error } = await supabase
          .from("candidates")
          .update({
            documents: remaining,
            resume_url: primaryDoc?.url || null,
            resume_name: primaryDoc?.name || null,
          })
          .eq("id", id);

        if (error) throw error;

        setCandidate((prev) =>
          prev
            ? {
                ...prev,
                documents: remaining,
                resume_url: primaryDoc?.url || null,
                resume_name: primaryDoc?.name || null,
              }
            : prev
        );

        toast("Document Removed", "File removed from candidate profile.", "success");
      } catch (err: any) {
        toast("Error", err?.message || "Could not remove file", "error");
      }
    },
    [id, candidate, setCandidate]
  );

  return {
    fileInputRef,
    uploadingResume,
    uploadDocuments,
    uploadResume,
    uploadStageEvidence,
    deleteDocument,
  };
}
