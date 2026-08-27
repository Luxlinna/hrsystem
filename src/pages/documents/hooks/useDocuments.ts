import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { getDocumentUploadUrl } from "@/lib/r2-storage";
import type {
  Document,
  DocumentFolder,
  FolderFormState,
  DocFormState,
  DrawerTabKey,
  StatusFilter,
  ViewMode,
} from "../types";
import {
  DEFAULT_FOLDERS,
  FOLDER_COLOR_PRESETS,
  INITIAL_DOC_FORM,
  INITIAL_FOLDER_FORM,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "../constants";
import { exportDocumentsCSV } from "../exportUtils";

export function useDocuments() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const canManageDocs = isAdmin || (!!role && role.name !== "Staff");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>(DEFAULT_FOLDERS);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(["policy", "ops_solutions_mszk6twr"])
  );
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  // Drawers & Modals
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTabKey>("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Folder Add/Edit Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [folderForm, setFolderForm] = useState<FolderFormState>(INITIAL_FOLDER_FORM);
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  // Upload Form
  const [form, setForm] = useState<DocFormState>(INITIAL_DOC_FORM);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    let docQuery = supabase
      .from("documents")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!canManageDocs) {
      docQuery = docQuery.eq("visibility", "all");
    }

    const [docRes, folderRes] = await Promise.all([
      docQuery,
      supabase
        .from("document_folders")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    setDocuments((docRes.data as Document[]) || []);
    if (folderRes.data && folderRes.data.length > 0) {
      setFolders(folderRes.data as DocumentFolder[]);
    } else {
      setFolders(DEFAULT_FOLDERS);
    }
    setLoading(false);
  }, [canManageDocs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset drawer sub-tab on doc change
  useEffect(() => {
    setDrawerTab("overview");
  }, [selectedDoc?.id]);

  const handleDownload = useCallback(
    async (doc: Document) => {
      if (doc.file_url) {
        window.open(doc.file_url, "_blank");
      } else {
        toast("Download", "No attached file or external URL found for this document.", "error");
        return;
      }
      await supabase
        .from("documents")
        .update({ download_count: (doc.download_count || 0) + 1 })
        .eq("id", doc.id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
      );
      if (selectedDoc?.id === doc.id) {
        setSelectedDoc((prev) => (prev ? { ...prev, download_count: prev.download_count + 1 } : null));
      }
    },
    [selectedDoc?.id]
  );

  const handleCopyLink = useCallback((doc: Document) => {
    if (doc.file_url) {
      navigator.clipboard.writeText(doc.file_url);
      toast("Link Copied", "Direct document link copied to clipboard.", "success");
    } else {
      toast("No File Link", "No file URL is attached to this document.", "warning");
    }
  }, []);

  const handleQuickMoveFolder = useCallback(
    async (docId: string, newCategoryId: string) => {
      if (!canManageDocs) return;
      const targetFolder = folders.find((f) => f.id === newCategoryId);
      const { error } = await supabase.from("documents").update({ category: newCategoryId }).eq("id", docId);
      if (error) {
        toast("Move Failed", error.message, "error");
        return;
      }

      toast("File Moved", `Document moved to ${targetFolder?.label || newCategoryId}.`, "success");
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, category: newCategoryId } : d)));
      if (selectedDoc?.id === docId) {
        setSelectedDoc((prev) => (prev ? { ...prev, category: newCategoryId } : null));
      }
      logActivity({
        module: "documents",
        action: "updated",
        entityType: "document",
        entityId: docId,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Relocated document to folder "${targetFolder?.label || newCategoryId}"`,
      });
    },
    [canManageDocs, folders, selectedDoc?.id, actorName, role?.name]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title || !canManageDocs || submitting) return;
      setSubmitting(true);

      const tagsArr = form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      let fileUrl: string | null = null;
      let fileName = form.file_name || `${form.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      let fileSizeKb: number | null = null;

      if (fileUpload) {
        const ext = fileUpload.name.split(".").pop() || "pdf";
        fileName = fileUpload.name;
        fileSizeKb = Math.round(fileUpload.size / 1024);
        const key = `documents/${form.category}/${Date.now()}_${fileUpload.name}`;
        try {
          const { uploadUrl, publicUrl } = await getDocumentUploadUrl(key);
          const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            body: fileUpload,
            headers: { "Content-Type": fileUpload.type || "application/octet-stream" },
          });
          if (!uploadRes.ok) throw new Error("Failed to upload file to storage");
          fileUrl = publicUrl;
        } catch (err: any) {
          setSubmitting(false);
          toast("Upload Error", err.message || "Failed to upload file", "error");
          return;
        }
        setForm((prev) => ({ ...prev, file_type: ext }));
      } else if (fileLink.trim()) {
        fileUrl = fileLink.trim();
      }

      const payload = {
        title: form.title,
        category: form.category,
        subcategory: form.subcategory || null,
        description: form.description || null,
        file_name: fileName,
        file_type: fileUpload ? (fileUpload.name.split(".").pop() || "pdf") : form.file_type,
        file_url: fileUrl || (editingDoc ? editingDoc.file_url : null),
        file_size_kb: fileSizeKb || (editingDoc ? editingDoc.file_size_kb : null),
        version: form.version,
        visibility: form.visibility,
        author_name: form.author_name,
        is_template: form.is_template,
        tags: tagsArr,
      };

      let error;
      if (editingDoc) {
        ({ error } = await supabase.from("documents").update(payload).eq("id", editingDoc.id));
      } else {
        ({ error } = await supabase.from("documents").insert({ ...payload, status: "active" }));
      }

      setSubmitting(false);
      if (error) {
        toast("Error", editingDoc ? "Failed to update document" : "Failed to save document record", "error");
      } else {
        toast("Success", editingDoc ? "Document updated successfully" : "Document uploaded successfully", "success");
        logActivity({
          module: "documents",
          action: editingDoc ? "updated" : "created",
          entityType: "document",
          actorName,
          actorRole: role?.name || "Unknown",
          description: `${editingDoc ? "Updated" : "Uploaded"} document "${form.title}" (${form.category})`,
        });

        setShowUploadModal(false);
        setEditingDoc(null);
        setForm(INITIAL_DOC_FORM);
        setFileUpload(null);
        setFileLink("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData();
      }
    },
    [form, canManageDocs, submitting, fileUpload, fileLink, editingDoc, actorName, role?.name, loadData]
  );

  const handleArchive = useCallback(
    async (doc: Document) => {
      if (!canManageDocs) return;
      const newStatus = doc.status === "active" ? "archived" : "active";
      const { error } = await supabase.from("documents").update({ status: newStatus }).eq("id", doc.id);
      if (!error) {
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d)));
        if (selectedDoc?.id === doc.id) setSelectedDoc({ ...selectedDoc, status: newStatus });
        toast("Status Updated", `Document has been ${newStatus === "archived" ? "archived" : "restored"}.`, "success");
        logActivity({
          module: "documents",
          action: "updated",
          entityType: "document",
          entityId: doc.id,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `${newStatus === "archived" ? "Archived" : "Restored"} document "${doc.title}"`,
        });
      }
    },
    [canManageDocs, selectedDoc, actorName, role?.name]
  );

  const handleDelete = useCallback(
    async (doc: Document) => {
      if (!canManageDocs) return;
      if (!confirm(`Delete "${doc.title}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", doc.id);
      if (error) {
        toast("Error", "Failed to delete document", "error");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setSelectedDoc(null);
      toast("Moved to Recycle Bin", `"${doc.title}" has been moved to Recycle Bin.`, "success");
      logActivity({
        module: "documents",
        action: "deleted",
        entityType: "document",
        entityId: doc.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Moved document "${doc.title}" to Recycle Bin`,
      });
    },
    [canManageDocs, actorName, role?.name]
  );

  const openEdit = useCallback((doc: Document) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      category: doc.category,
      subcategory: doc.subcategory || "",
      description: doc.description || "",
      file_name: doc.file_name || "",
      file_type: doc.file_type,
      version: doc.version,
      visibility: doc.visibility,
      author_name: doc.author_name,
      is_template: doc.is_template,
      tags: doc.tags?.join(", ") || "",
    });
    if (doc.file_url && !doc.file_url.includes("/storage/v1/") && !doc.file_url.includes(".r2.dev")) {
      setFileLink(doc.file_url);
    } else {
      setFileLink("");
    }
    setShowUploadModal(true);
  }, []);

  const openUploadModal = useCallback(() => {
    setEditingDoc(null);
    setForm({
      ...INITIAL_DOC_FORM,
      category: activeCategory !== "all" ? activeCategory : (folders[0]?.id || "policy"),
    });
    setFileUpload(null);
    setFileLink("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowUploadModal(true);
  }, [activeCategory, folders]);

  // Folder & Subfolder Operations
  const openNewFolderModal = useCallback((parentFolderId?: string) => {
    setEditingFolder(null);
    setFolderForm({
      label: "",
      parentId: parentFolderId || "",
      icon: parentFolderId ? "ri-folder-2-line" : "ri-folder-line",
      colorPreset: "navy",
      description: "",
    });
    setShowFolderModal(true);
  }, []);

  const openEditFolderModal = useCallback((folder: DocumentFolder) => {
    setEditingFolder(folder);
    const matchedPreset =
      FOLDER_COLOR_PRESETS.find((p) => p.color === folder.color)?.id || FOLDER_COLOR_PRESETS[0].id;
    setFolderForm({
      label: folder.label,
      parentId: folder.parent_id || "",
      icon: folder.icon,
      colorPreset: matchedPreset,
      description: folder.description || "",
    });
    setShowFolderModal(true);
  }, []);

  const handleSaveFolder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!folderForm.label.trim() || !canManageDocs || folderSubmitting) return;
      setFolderSubmitting(true);

      const preset = FOLDER_COLOR_PRESETS.find((p) => p.id === folderForm.colorPreset) || FOLDER_COLOR_PRESETS[0];
      const parentIdVal = folderForm.parentId ? folderForm.parentId : null;

      if (editingFolder) {
        const { error } = await supabase
          .from("document_folders")
          .update({
            label: folderForm.label.trim(),
            parent_id: parentIdVal,
            icon: folderForm.icon,
            color: preset.color,
            bg: preset.bg,
            description: folderForm.description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFolder.id);

        setFolderSubmitting(false);

        if (error) {
          toast("Folder Update Error", error.message, "error");
          return;
        }

        toast("Folder Updated", `Folder "${folderForm.label}" updated successfully.`, "success");
        logActivity({
          module: "documents",
          action: "updated",
          entityType: "document_folder",
          entityId: editingFolder.id,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `Updated document folder "${folderForm.label}"`,
        });
      } else {
        const slug =
          folderForm.label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .slice(0, 20) +
          "_" +
          Date.now().toString(36);

        const newFolderPayload = {
          id: slug,
          label: folderForm.label.trim(),
          parent_id: parentIdVal,
          icon: folderForm.icon,
          color: preset.color,
          bg: preset.bg,
          description: folderForm.description.trim() || null,
          is_system: false,
          sort_order: folders.length + 1,
        };

        const { error } = await supabase.from("document_folders").insert(newFolderPayload);
        setFolderSubmitting(false);

        if (error) {
          toast("Folder Creation Error", error.message, "error");
          return;
        }

        toast(
          parentIdVal ? "Subfolder Created" : "Folder Created",
          `${parentIdVal ? "Subfolder" : "Folder"} "${folderForm.label}" created successfully.`,
          "success"
        );

        if (parentIdVal) {
          setExpandedFolderIds((prev) => new Set([...prev, parentIdVal]));
        }

        logActivity({
          module: "documents",
          action: "created",
          entityType: "document_folder",
          entityId: slug,
          actorName,
          actorRole: role?.name || "Unknown",
          description: `Created document ${parentIdVal ? "subfolder" : "folder"} "${folderForm.label}"`,
        });
      }

      setShowFolderModal(false);
      loadData();
    },
    [folderForm, canManageDocs, folderSubmitting, editingFolder, folders.length, actorName, role?.name, loadData]
  );

  const handleDeleteFolder = useCallback(
    async (folder: DocumentFolder) => {
      if (!canManageDocs || folder.is_system) return;
      const isSub = !!folder.parent_id;
      if (
        !confirm(
          `Are you sure you want to delete ${isSub ? "subfolder" : "folder"} "${folder.label}"? Any documents in this ${
            isSub ? "subfolder" : "folder"
          } will be safely moved to "Policies".`
        )
      ) {
        return;
      }

      await supabase.from("documents").update({ category: "policy" }).eq("category", folder.id);
      const { error } = await supabase.from("document_folders").delete().eq("id", folder.id);

      if (error) {
        toast("Error", error.message, "error");
        return;
      }

      toast("Folder Deleted", `"${folder.label}" removed successfully.`, "success");
      logActivity({
        module: "documents",
        action: "deleted",
        entityType: "document_folder",
        entityId: folder.id,
        actorName,
        actorRole: role?.name || "Unknown",
        description: `Deleted document folder "${folder.label}"`,
      });

      if (activeCategory === folder.id) {
        setActiveCategory("all");
      }
      loadData();
    },
    [canManageDocs, activeCategory, actorName, role?.name, loadData]
  );

  const toggleFolderExpanded = useCallback((folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    exportDocumentsCSV(documents);
  }, [documents]);

  // Hierarchy Helpers
  const rootFolders = useMemo(() => folders.filter((f) => !f.parent_id), [folders]);
  const getSubfolders = useCallback((parentId: string) => folders.filter((f) => f.parent_id === parentId), [folders]);

  const activeFolderObj = useMemo(() => folders.find((f) => f.id === activeCategory), [folders, activeCategory]);
  const activeParentFolder = useMemo(() => {
    if (!activeFolderObj) return null;
    if (activeFolderObj.parent_id) {
      return folders.find((f) => f.id === activeFolderObj.parent_id) || null;
    }
    return activeFolderObj;
  }, [folders, activeFolderObj]);

  const currentSubfolders = useMemo(() => {
    if (!activeParentFolder) return [];
    return getSubfolders(activeParentFolder.id);
  }, [getSubfolders, activeParentFolder]);

  const relatedDocuments = useMemo(() => {
    if (!selectedDoc) return [];
    return documents.filter((d) => d.id !== selectedDoc.id && d.category === selectedDoc.category).slice(0, 6);
  }, [documents, selectedDoc]);

  // Filtered documents calculation
  const filtered = useMemo(() => {
    const subfolderIds = activeFolderObj && !activeFolderObj.parent_id
      ? folders.filter((f) => f.parent_id === activeFolderObj.id).map((f) => f.id)
      : [];
    const validCategoryIds = activeFolderObj
      ? [activeFolderObj.id, ...subfolderIds]
      : [];

    return documents.filter((d) => {
      if (!canManageDocs && (d.visibility === "hr_only" || d.visibility === "managers")) return false;
      if (activeCategory !== "all" && !validCategoryIds.includes(d.category)) return false;
      if (filterTemplate === true && !d.is_template) return false;
      if (filterTemplate === false && d.is_template) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (visibilityFilter === "all_staff" && d.visibility !== "all") return false;
      if (visibilityFilter === "managers" && d.visibility !== "managers") return false;
      if (visibilityFilter === "hr_only" && d.visibility !== "hr_only") return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const title = (d.title || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const author = (d.author_name || "").toLowerCase();
        const tags = (d.tags || []).join(" ").toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !author.includes(q) && !tags.includes(q)) return false;
      }
      return true;
    });
  }, [documents, canManageDocs, activeCategory, activeFolderObj, folders, filterTemplate, statusFilter, visibilityFilter, search]);

  // Aggregate Metrics
  const activeDocsCount = useMemo(() => documents.filter((d) => d.status === "active").length, [documents]);
  const templatesCount = useMemo(() => documents.filter((d) => d.is_template).length, [documents]);
  const totalDownloads = useMemo(() => documents.reduce((s, d) => s + (d.download_count || 0), 0), [documents]);
  const archivedCount = useMemo(() => documents.filter((d) => d.status === "archived").length, [documents]);

  // Document counts per folder & subfolder
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    folders.forEach((f) => {
      if (!f.parent_id) {
        const childIds = folders.filter((c) => c.parent_id === f.id).map((c) => c.id);
        const allIds = [f.id, ...childIds];
        counts[f.id] = documents.filter((d) => allIds.includes(d.category)).length;
      } else {
        counts[f.id] = documents.filter((d) => d.category === f.id).length;
      }
    });
    return counts;
  }, [documents, folders]);

  // Pagination calculation
  const docTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const docSafePage = Math.min(page, docTotalPages);
  const docPageStart = filtered.length === 0 ? 0 : (docSafePage - 1) * pageSize + 1;
  const docPageEnd = Math.min(docSafePage * pageSize, filtered.length);
  const pagedDocs = useMemo(
    () => filtered.slice((docSafePage - 1) * pageSize, docSafePage * pageSize),
    [filtered, docSafePage, pageSize]
  );

  useEffect(() => {
    if (page > docTotalPages) setPage(docTotalPages);
  }, [page, docTotalPages]);

  return {
    canManageDocs,
    documents,
    folders,
    expandedFolderIds,
    loading,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filterTemplate,
    setFilterTemplate,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    selectedDoc,
    setSelectedDoc,
    drawerTab,
    setDrawerTab,
    showUploadModal,
    setShowUploadModal,
    editingDoc,
    submitting,
    showFolderModal,
    setShowFolderModal,
    editingFolder,
    folderForm,
    setFolderForm,
    folderSubmitting,
    form,
    setForm,
    fileUpload,
    setFileUpload,
    fileLink,
    setFileLink,
    dragOver,
    setDragOver,
    fileInputRef,
    rootFolders,
    getSubfolders,
    activeFolderObj,
    activeParentFolder,
    currentSubfolders,
    relatedDocuments,
    filtered,
    activeDocsCount,
    templatesCount,
    totalDownloads,
    archivedCount,
    categoryCounts,
    docTotalPages,
    docSafePage,
    docPageStart,
    docPageEnd,
    pagedDocs,
    handleDownload,
    handleCopyLink,
    handleQuickMoveFolder,
    handleSubmit,
    handleArchive,
    handleDelete,
    openEdit,
    openUploadModal,
    openNewFolderModal,
    openEditFolderModal,
    handleSaveFolder,
    handleDeleteFolder,
    toggleFolderExpanded,
    handleExportCSV,
  };
}
