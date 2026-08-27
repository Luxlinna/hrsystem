import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { toast } from "@/components/Toast";
import type { OnboardingRequest, OnboardingDoc, DocForm } from "../types";
import { STAGES } from "../constants";
import { formatDateTimeLocal } from "../onboardingUtils";
import { STAGE_DEFAULT_DUE_DAYS } from "@/lib/onboarding";

interface UseOnboardingDocMutationsProps {
  loadData: () => Promise<void>;
  getDocsForRequestAndStage: (reqId: string, stageKey: string) => OnboardingDoc[];
}

export function useOnboardingDocMutations({
  loadData,
  getDocsForRequestAndStage,
}: UseOnboardingDocMutationsProps) {
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [docForm, setDocForm] = useState<DocForm>({ document_name: "", notes: "", due_date: "" });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openDocModal = useCallback((req: OnboardingRequest, stage: string) => {
    setSelectedRequest(req);
    setSelectedStage(stage);
    const defaultDue = new Date(
      new Date(req.created_at).getTime() + (STAGE_DEFAULT_DUE_DAYS[stage] ?? 7) * 86400000
    );
    setDocForm({ document_name: "", notes: "", due_date: formatDateTimeLocal(defaultDue) });
    setSelectedFileName(null);
    setEditingDocId(null);
    setShowDocModal(true);
  }, []);

  const openEditDocModal = useCallback((req: OnboardingRequest, doc: OnboardingDoc) => {
    setSelectedRequest(req);
    setSelectedStage(doc.stage);
    setDocForm({
      document_name: doc.document_name,
      notes: doc.notes || "",
      due_date: doc.due_date ? doc.due_date.slice(0, 16) : "",
    });
    setSelectedFileName(doc.file_name);
    setEditingDocId(doc.id);
    setShowDocModal(true);
  }, []);

  const handleDocUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedStage || !docForm.document_name.trim()) return;

    setUploading(true);
    const file = fileInputRef.current?.files?.[0];
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      try {
        fileUrl = await uploadFile("onboarding-documents", `${selectedRequest.id}/${Date.now()}_${file.name}`, file);
        fileName = file.name;
      } catch (err) {
        toast("Upload Error", err instanceof Error ? err.message : "File upload failed", "error");
        setUploading(false);
        return;
      }
    }

    const { error } = editingDocId
      ? await supabase
          .from("onboarding_documents")
          .update({
            document_name: docForm.document_name.trim(),
            notes: docForm.notes.trim() || null,
            due_date: docForm.due_date ? new Date(docForm.due_date).toISOString() : null,
            ...(file ? { file_url: fileUrl, file_name: fileName, status: "complete" } : {}),
          })
          .eq("id", editingDocId)
      : await supabase.from("onboarding_documents").insert({
          onboarding_request_id: selectedRequest.id,
          employee_id: selectedRequest.employee_id,
          document_name: docForm.document_name.trim(),
          stage: selectedStage,
          status: fileUrl ? "complete" : "pending",
          file_url: fileUrl,
          file_name: fileName,
          notes: docForm.notes.trim() || null,
          due_date: docForm.due_date ? new Date(docForm.due_date).toISOString() : null,
        });

    setUploading(false);
    setShowDocModal(false);

    if (error) {
      toast("Error", editingDocId ? "Failed to save document" : "Failed to add checklist item", "error");
    } else {
      toast("Saved", editingDocId ? "Document updated" : "Document added to checklist", "success");
      setDocForm({ document_name: "", notes: "", due_date: "" });
      setSelectedFileName(null);
      setEditingDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
    }
  }, [selectedRequest, selectedStage, docForm, editingDocId, loadData]);

  const bulkSetStageDeadline = useCallback(async (req: OnboardingRequest, stageKey: string, days: number) => {
    const target = getDocsForRequestAndStage(req.id, stageKey).filter((d) => d.status !== "complete" && !d.due_date);
    if (target.length === 0) {
      toast("No Items to Update", "Every item in this step is already complete or has a due date.", "info");
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + days);
    const { error } = await supabase
      .from("onboarding_documents")
      .update({ due_date: due.toISOString() })
      .in("id", target.map((d) => d.id));
    if (error) {
      toast("Error", "Failed to set deadlines", "error");
    } else {
      const stageLabel = STAGES.find((s) => s.key === stageKey)?.label || stageKey;
      toast("Deadline Set", `${target.length} item${target.length > 1 ? "s" : ""} in "${stageLabel}" due ${due.toLocaleDateString()}`, "success");
      loadData();
    }
  }, [getDocsForRequestAndStage, loadData]);

  return {
    showDocModal,
    setShowDocModal,
    selectedRequest,
    selectedStage,
    docForm,
    setDocForm,
    selectedFileName,
    editingDocId,
    uploading,
    isDragOver,
    setIsDragOver,
    fileInputRef,
    openDocModal,
    openEditDocModal,
    handleDocUpload,
    bulkSetStageDeadline,
  };
}
