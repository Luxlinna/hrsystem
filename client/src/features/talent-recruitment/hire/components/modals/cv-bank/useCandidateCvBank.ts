import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Candidate } from "../../../types";

export interface CvIngestionSettings {
  autoParseCv: boolean;
  duplicateDetection: boolean;
  ocrFallback: boolean;
  maxFileSizeMb: number;
  allowedFormats: string[];
}

export function useCandidateCvBank(
  candidates: Candidate[],
  onRefresh?: () => Promise<void> | void
) {
  const [activeTab, setActiveTab] = useState<"repository" | "settings">("repository");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [reparsingId, setReparsingId] = useState<string | null>(null);

  const [settings, setSettings] = useState<CvIngestionSettings>({
    autoParseCv: true,
    duplicateDetection: true,
    ocrFallback: true,
    maxFileSizeMb: 15,
    allowedFormats: [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".webp"],
  });

  const candidatesWithCv = useMemo(() => {
    return candidates.filter((c) => Boolean(c.resume_url || (c.documents && c.documents.length > 0)));
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidatesWithCv.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.job_title || c.position || c.job_postings?.title || "").toLowerCase().includes(q) ||
        (c.skills || []).some((s) => s.toLowerCase().includes(q));

      const ext = (c.resume_name || c.resume_url || "").split(".").pop()?.toLowerCase() || "";
      const matchFormat =
        formatFilter === "all" ||
        (formatFilter === "pdf" && ext.includes("pdf")) ||
        (formatFilter === "word" && (ext.includes("doc") || ext.includes("docx"))) ||
        (formatFilter === "image" && ["png", "jpg", "jpeg", "webp"].includes(ext));

      const matchStage = stageFilter === "all" || c.stage === stageFilter;
      return matchSearch && matchFormat && matchStage;
    });
  }, [candidatesWithCv, searchQuery, formatFilter, stageFilter]);

  const handleReuploadCv = async (candidateId: string, file: File) => {
    try {
      toast("Uploading", `Uploading ${file.name} to AWS S3 storage...`, "info");
      const fileExt = file.name.split(".").pop();
      const filePath = `resumes/${candidateId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("candidate-resumes").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("candidate-resumes").getPublicUrl(filePath);
      const { error: dbError } = await supabase.from("candidates").update({ resume_url: publicUrl, resume_name: file.name }).eq("id", candidateId);
      if (dbError) throw dbError;

      toast("CV Updated", `Updated resume for candidate.`, "success");
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      toast("Upload Failed", err.message || "Could not upload file", "error");
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("cv_ingestion_settings", JSON.stringify(settings));
    toast("Settings Saved", "CV ingestion and parsing rules updated.", "success");
  };

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    formatFilter,
    setFormatFilter,
    stageFilter,
    setStageFilter,
    previewCandidate,
    setPreviewCandidate,
    reparsingId,
    setReparsingId,
    settings,
    setSettings,
    totalWithCv: candidatesWithCv.length,
    filteredCandidates,
    handleReuploadCv,
    handleSaveSettings,
  };
}
