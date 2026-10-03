import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Document, DocFormState } from "../types";
import { INITIAL_DOC_FORM } from "../constants";
import { useDocumentUpload } from "./useDocumentUpload";

interface UseDocumentMutationsProps {
  actorName: string;
  roleName?: string;
  targetBranch: string | null;
  loadData: () => Promise<void>;
  selectedDoc: Document | null;
  setSelectedDoc: React.Dispatch<React.SetStateAction<Document | null>>;
  activeCategory: string;
}

export function useDocumentMutations({
  actorName,
  targetBranch,
  loadData,
  selectedDoc,
  setSelectedDoc,
  activeCategory,
}: UseDocumentMutationsProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<DocFormState>(INITIAL_DOC_FORM);

  const upload = useDocumentUpload();

  const openUploadModal = useCallback(() => {
    setEditingDoc(null);
    setForm({ ...INITIAL_DOC_FORM, category: activeCategory !== "all" ? activeCategory : "policy" });
    upload.resetUploadState();
    setShowUploadModal(true);
  }, [activeCategory, upload]);

  const openEdit = useCallback(
    (doc: Document) => {
      setEditingDoc(doc);
      setForm({
        ...INITIAL_DOC_FORM,
        title: doc.title,
        category: doc.category,
        subcategory: doc.subcategory || "",
        department: doc.department || "",
        visibility: doc.visibility,
        description: doc.description || "",
        status: doc.status,
        version: doc.version,
        is_template: doc.is_template,
        author_name: doc.author_name || "HR Team",
        file_name: doc.file_name || "",
        file_type: doc.file_type || "pdf",
        requires_acknowledgment: doc.requires_acknowledgment,
        tags: (doc.tags || []).join(", "),
        tagsInput: (doc.tags || []).join(", "),
        change_summary: "",
      });
      upload.resetUploadState();
      upload.setFileLink(doc.file_url || "");
      setShowUploadModal(true);
    },
    [upload]
  );

  const handleQuickMoveFolder = useCallback(
    async (doc: Document, newCategoryId: string) => {
      try {
        const { error } = await supabase.from("documents").update({ category: newCategoryId }).eq("id", doc.id);
        if (error) throw error;
        toast("Moved", "Document moved successfully.", "success");
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc((prev) => (prev ? { ...prev, category: newCategoryId } : null));
        }
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to move folder", "error");
      }
    },
    [selectedDoc?.id, setSelectedDoc, loadData]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title.trim()) return;
      setSubmitting(true);
      try {
        const { finalFileUrl, finalFileName, finalFileSize, finalFileType } =
          await upload.uploadFileToStorage(form.title);
        const tags = (form.tagsInput || form.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

        const basePayload = {
          title: form.title,
          category: form.category,
          department: form.department || null,
          visibility: form.visibility,
          description: form.description || null,
          status: form.status,
          version: form.version || "1.0",
          is_template: form.is_template,
          requires_acknowledgment: form.requires_acknowledgment,
          tags,
          ...(finalFileUrl ? {
            file_url: finalFileUrl,
            file_name: finalFileName,
            file_size: finalFileSize,
            file_type: finalFileType,
          } : {}),
        };

        if (editingDoc) {
          const { error } = await supabase.from("documents").update(basePayload).eq("id", editingDoc.id);
          if (error) throw error;
          toast("Document Updated", `"${form.title}" saved.`, "success");
        } else {
          const { error } = await supabase.from("documents").insert({
            ...basePayload,
            created_by: actorName,
            branch_id: targetBranch,
          });
          if (error) throw error;
          toast("Document Created", `"${form.title}" published.`, "success");
        }
        setShowUploadModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to save document.", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [form, editingDoc, upload, actorName, targetBranch, loadData]
  );

  const handleArchive = useCallback(
    async (doc: Document) => {
      const nextStatus = doc.status === "archived" ? "active" : "archived";
      const { error } = await supabase.from("documents").update({ status: nextStatus }).eq("id", doc.id);
      if (error) {
        toast("Error", error.message, "error");
        return;
      }
      toast("Status Updated", `Document marked as ${nextStatus}.`, "success");
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      await loadData();
    },
    [selectedDoc?.id, setSelectedDoc, loadData]
  );

  const handleDelete = useCallback(
    async (doc: Document) => {
      if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
      const { error } = await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", doc.id);
      if (error) {
        toast("Error", error.message, "error");
        return;
      }
      toast("Deleted", `Document "${doc.title}" moved to trash.`, "success");
      setSelectedDoc(null);
      await loadData();
    },
    [setSelectedDoc, loadData]
  );

  return {
    showUploadModal,
    setShowUploadModal,
    editingDoc,
    submitting,
    form,
    setForm,
    fileUpload: upload.fileUpload,
    setFileUpload: upload.setFileUpload,
    fileLink: upload.fileLink,
    setFileLink: upload.setFileLink,
    dragOver: upload.dragOver,
    setDragOver: upload.setDragOver,
    fileInputRef: upload.fileInputRef,
    openUploadModal,
    openEdit,
    handleQuickMoveFolder,
    handleSubmit,
    handleArchive,
    handleDelete,
  };
}
