import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { getDocumentUploadUrl } from "@/lib/r2-storage";

interface Document {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  file_name: string | null;
  file_size_kb: number | null;
  file_type: string;
  file_url: string | null;
  version: string;
  status: string;
  visibility: string;
  author_name: string;
  tags: string[];
  download_count: number;
  is_template: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentFolder {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border?: string;
  description?: string | null;
  is_system?: boolean;
  sort_order?: number;
  parent_id?: string | null;
}

const DEFAULT_FOLDERS: DocumentFolder[] = [
  { id: "policy", label: "Policies", icon: "ri-file-text-line", color: "text-blue-600", bg: "bg-blue-50", is_system: true, sort_order: 1, parent_id: null },
  { id: "contract", label: "Contracts", icon: "ri-draft-line", color: "text-amber-600", bg: "bg-amber-50", is_system: true, sort_order: 2, parent_id: null },
  { id: "template", label: "Templates", icon: "ri-file-copy-line", color: "text-violet-600", bg: "bg-violet-50", is_system: true, sort_order: 3, parent_id: null },
  { id: "compliance", label: "Compliance", icon: "ri-shield-check-line", color: "text-cyan-600", bg: "bg-cyan-50", is_system: true, sort_order: 4, parent_id: null },
  { id: "benefits", label: "Benefits", icon: "ri-heart-pulse-line", color: "text-rose-600", bg: "bg-rose-50", is_system: true, sort_order: 5, parent_id: null },
  { id: "training", label: "Training", icon: "ri-graduation-cap-line", color: "text-emerald-600", bg: "bg-emerald-50", is_system: true, sort_order: 6, parent_id: null },
  { id: "org", label: "Org Docs", icon: "ri-organization-chart", color: "text-slate-600", bg: "bg-slate-100", is_system: true, sort_order: 7, parent_id: null },
];

const FOLDER_COLOR_PRESETS = [
  { id: "blue", label: "Blue", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "amber", label: "Amber", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "violet", label: "Violet", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  { id: "cyan", label: "Cyan", color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  { id: "rose", label: "Rose", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { id: "emerald", label: "Emerald", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "slate", label: "Slate", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  { id: "indigo", label: "Indigo", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "orange", label: "Orange", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
];

const AVAILABLE_FOLDER_ICONS = [
  "ri-folder-line",
  "ri-folder-2-line",
  "ri-folder-user-line",
  "ri-folder-chart-line",
  "ri-folder-lock-line",
  "ri-folder-shared-line",
  "ri-folder-shield-line",
  "ri-file-text-line",
  "ri-draft-line",
  "ri-file-copy-line",
  "ri-shield-check-line",
  "ri-heart-pulse-line",
  "ri-graduation-cap-line",
  "ri-organization-chart",
  "ri-briefcase-line",
  "ri-booklet-line",
  "ri-award-line",
  "ri-scales-3-line",
  "ri-bank-card-line",
  "ri-building-line",
  "ri-settings-4-line",
  "ri-tools-line",
  "ri-customer-service-2-line",
  "ri-global-line",
];

const FILE_TYPE_ICON: Record<string, string> = {
  pdf: "ri-file-pdf-line",
  doc: "ri-file-word-line",
  docx: "ri-file-word-line",
  xls: "ri-file-excel-line",
  xlsx: "ri-file-excel-line",
  csv: "ri-file-excel-line",
  ppt: "ri-file-ppt-line",
  pptx: "ri-file-ppt-line",
  jpg: "ri-image-line",
  jpeg: "ri-image-line",
  png: "ri-image-line",
  gif: "ri-image-line",
  webp: "ri-image-line",
  svg: "ri-image-line",
  txt: "ri-file-text-line",
  md: "ri-file-text-line",
  json: "ri-file-code-line",
  zip: "ri-file-zip-line",
  rar: "ri-file-zip-line",
  mp4: "ri-video-line",
  mp3: "ri-music-line",
};

const FILE_TYPE_COLOR: Record<string, string> = {
  pdf: "bg-rose-50 text-rose-600 border-rose-200",
  doc: "bg-sky-50 text-sky-600 border-sky-200",
  docx: "bg-sky-50 text-sky-600 border-sky-200",
  xls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  xlsx: "bg-emerald-50 text-emerald-700 border-emerald-200",
  csv: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ppt: "bg-amber-50 text-amber-600 border-amber-200",
  pptx: "bg-amber-50 text-amber-600 border-amber-200",
  jpg: "bg-violet-50 text-violet-600 border-violet-200",
  jpeg: "bg-violet-50 text-violet-600 border-violet-200",
  png: "bg-violet-50 text-violet-600 border-violet-200",
  gif: "bg-violet-50 text-violet-600 border-violet-200",
  webp: "bg-violet-50 text-violet-600 border-violet-200",
  svg: "bg-violet-50 text-violet-600 border-violet-200",
  txt: "bg-gray-100 text-gray-700 border-gray-200",
  md: "bg-gray-100 text-gray-700 border-gray-200",
  json: "bg-yellow-50 text-yellow-700 border-yellow-200",
  zip: "bg-orange-50 text-orange-600 border-orange-200",
  rar: "bg-orange-50 text-orange-600 border-orange-200",
  mp4: "bg-pink-50 text-pink-600 border-pink-200",
  mp3: "bg-pink-50 text-pink-600 border-pink-200",
};

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: "All Staff", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  hr_only: { label: "HR Only", color: "bg-amber-50 text-amber-700 border-amber-200" },
  managers: { label: "Managers Only", color: "bg-violet-50 text-violet-700 border-violet-200" },
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const canManageDocs = isAdmin || (!!role && role.name !== "Staff");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>(DEFAULT_FOLDERS);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set(["policy", "ops_solutions_mszk6twr"]));
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Pagination
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  // Drawers & Modals
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "related" | "move">("overview");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Folder Add/Edit Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [folderForm, setFolderForm] = useState({
    label: "",
    parentId: "",
    icon: "ri-folder-line",
    colorPreset: "blue",
    description: "",
  });
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  // Upload Form
  const [form, setForm] = useState({
    title: "",
    category: "policy",
    subcategory: "",
    description: "",
    file_name: "",
    file_type: "pdf",
    version: "1.0",
    visibility: "all",
    author_name: "HR Team",
    is_template: false,
    tags: "",
  });
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [canManageDocs]);

  // Reset drawer sub-tab on doc change
  useEffect(() => {
    setDrawerTab("overview");
  }, [selectedDoc?.id]);

  const loadData = async () => {
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
  };

  const handleDownload = async (doc: Document) => {
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
  };

  const handleCopyLink = (doc: Document) => {
    if (doc.file_url) {
      navigator.clipboard.writeText(doc.file_url);
      toast("Link Copied", "Direct document link copied to clipboard.", "success");
    } else {
      toast("No File Link", "No file URL is attached to this document.", "warning");
    }
  };

  const handleQuickMoveFolder = async (docId: string, newCategoryId: string) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setForm({
        title: "",
        category: folders[0]?.id || "policy",
        subcategory: "",
        description: "",
        file_name: "",
        file_type: "pdf",
        version: "1.0",
        visibility: "all",
        author_name: "HR Team",
        is_template: false,
        tags: "",
      });
      setFileUpload(null);
      setFileLink("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
    }
  };

  const handleArchive = async (doc: Document) => {
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
  };

  const handleDelete = async (doc: Document) => {
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
  };

  const openEdit = (doc: Document) => {
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
  };

  // Folder & Subfolder Operations
  const openNewFolderModal = (parentFolderId?: string) => {
    setEditingFolder(null);
    setFolderForm({
      label: "",
      parentId: parentFolderId || "",
      icon: parentFolderId ? "ri-folder-2-line" : "ri-folder-line",
      colorPreset: "blue",
      description: "",
    });
    setShowFolderModal(true);
  };

  const openEditFolderModal = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    const matchedPreset = FOLDER_COLOR_PRESETS.find((p) => p.color === folder.color)?.id || "blue";
    setFolderForm({
      label: folder.label,
      parentId: folder.parent_id || "",
      icon: folder.icon,
      colorPreset: matchedPreset,
      description: folder.description || "",
    });
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.label.trim() || !canManageDocs || folderSubmitting) return;
    setFolderSubmitting(true);

    const preset = FOLDER_COLOR_PRESETS.find((p) => p.id === folderForm.colorPreset) || FOLDER_COLOR_PRESETS[0];
    const parentIdVal = folderForm.parentId ? folderForm.parentId : null;

    if (editingFolder) {
      // Update existing folder
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
      // Create new folder / subfolder
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

      // Auto expand the parent folder
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
  };

  const handleDeleteFolder = async (folder: DocumentFolder) => {
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

    // 1. Reassign existing docs to 'policy'
    await supabase.from("documents").update({ category: "policy" }).eq("category", folder.id);

    // 2. Delete folder (cascades to subfolders if any)
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
  };

  const toggleFolderExpanded = (folderId: string, e?: React.MouseEvent) => {
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
  };

  const handleExportCSV = () => {
    const headers = ["Title", "Category", "Subcategory", "File Type", "Size KB", "Version", "Visibility", "Status", "Author", "Downloads", "Is Template", "Created Date"];
    const rows = filtered.map((d) => [
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.subcategory || ""}"`,
      `"${d.file_type}"`,
      d.file_size_kb || 0,
      `"${d.version}"`,
      `"${d.visibility}"`,
      `"${d.status}"`,
      `"${d.author_name}"`,
      d.download_count || 0,
      d.is_template ? "Yes" : "No",
      `"${d.created_at}"`,
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", `documents_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filtered.length} documents.`, "success");
  };

  // Hierarchy Helpers
  const rootFolders = useMemo(() => folders.filter((f) => !f.parent_id), [folders]);
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parent_id === parentId);

  // Active folder details
  const activeFolderObj = useMemo(() => folders.find((f) => f.id === activeCategory), [folders, activeCategory]);
  const activeParentFolder = useMemo(() => {
    if (!activeFolderObj) return null;
    if (activeFolderObj.parent_id) {
      return folders.find((f) => f.id === activeFolderObj.parent_id) || null;
    }
    return activeFolderObj;
  }, [folders, activeFolderObj]);

  // Subfolders of the currently active folder (if any)
  const currentSubfolders = useMemo(() => {
    if (!activeParentFolder) return [];
    return getSubfolders(activeParentFolder.id);
  }, [folders, activeParentFolder]);

  // Related documents in the same folder as selectedDoc
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
  const pagedDocs = filtered.slice((docSafePage - 1) * pageSize, docSafePage * pageSize);

  useEffect(() => {
    if (page > docTotalPages) setPage(docTotalPages);
  }, [page, docTotalPages]);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const formatSize = (kb: number | null) => {
    if (!kb) return "—";
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  // Clean filename helper (strips timestamp prefix)
  const cleanFileName = (name: string | null) => {
    if (!name) return "document.pdf";
    return name.replace(/^\d+_/, "");
  };

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading document repository...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Corporate Knowledge</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Document Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Corporate Knowledge & Files
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              {documents.length} Files
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Organize and browse company policies, departmental SOPs, subfolders, contracts, and templates.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export Catalog
          </button>

          {canManageDocs && (
            <>
              <button
                onClick={() => openNewFolderModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-[#253C7D] text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <i className="ri-folder-add-line text-sm" />
                + New Folder
              </button>

              <button
                onClick={() => {
                  setEditingDoc(null);
                  setForm({
                    title: "",
                    category: activeCategory !== "all" ? activeCategory : (folders[0]?.id || "policy"),
                    subcategory: "",
                    description: "",
                    file_name: "",
                    file_type: "pdf",
                    version: "1.0",
                    visibility: "all",
                    author_name: "HR Team",
                    is_template: false,
                    tags: "",
                  });
                  setFileUpload(null);
                  setFileLink("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setShowUploadModal(true);
                }}
                className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
              >
                <i className="ri-upload-cloud-line text-base font-bold" />
                Upload Document
              </button>
            </>
          )}
        </div>
      </div>

      {/* Executive KPI Performance Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Active Documents */}
        <div
          onClick={() => {
            setStatusFilter("active");
            setFilterTemplate(null);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "active" && filterTemplate === null
              ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Files</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-file-text-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{activeDocsCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{rootFolders.length} Folders · {folders.length - rootFolders.length} Subfolders</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Templates */}
        <div
          onClick={() => {
            setFilterTemplate(true);
            setStatusFilter("all");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterTemplate === true ? "border-violet-500 ring-2 ring-violet-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">Templates</span>
            <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <i className="ri-file-copy-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-violet-700 mt-2">{templatesCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ready for reuse</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500" />
        </div>

        {/* Total Downloads */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Downloads</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-download-cloud-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalDownloads.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Staff distributions</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Archived Records */}
        <div
          onClick={() => {
            setStatusFilter("archived");
            setFilterTemplate(null);
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "archived" ? "border-slate-500 ring-2 ring-slate-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Archived</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <i className="ri-archive-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{archivedCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Historical records</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
        </div>
      </div>

      {/* Main Layout: Hierarchical Folders Sidebar + Documents Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories & Folders Tree Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Categories & Folders
              </span>
              {canManageDocs && (
                <button
                  onClick={() => openNewFolderModal()}
                  className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Add Top-Level Folder"
                >
                  <i className="ri-add-line" />
                  Add Folder
                </button>
              )}
            </div>

            {/* All Documents item */}
            <button
              onClick={() => {
                setActiveCategory("all");
                setPage(1);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm ${
                    activeCategory === "all" ? "bg-white/20 text-white" : "bg-[#253C7D]/10 text-[#253C7D]"
                  }`}
                >
                  <i className="ri-folder-line" />
                </div>
                <span>All Documents</span>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeCategory === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {categoryCounts["all"] || 0}
              </span>
            </button>

            {/* Root Folders & Nested Subfolders List */}
            {rootFolders.map((rf) => {
              const isSelected = activeCategory === rf.id;
              const subfolders = getSubfolders(rf.id);
              const isExpanded = expandedFolderIds.has(rf.id);
              const count = categoryCounts[rf.id] || 0;

              return (
                <div key={rf.id} className="space-y-1">
                  {/* Root Folder Item */}
                  <div
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#253C7D] text-white shadow-xs"
                        : "text-gray-700 hover:text-gray-900 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveCategory(rf.id);
                      setPage(1);
                      if (subfolders.length > 0 && !isExpanded) {
                        toggleFolderExpanded(rf.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Expand / Collapse Chevron */}
                      {subfolders.length > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => toggleFolderExpanded(rf.id, e)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-transform cursor-pointer ${
                            isExpanded ? "rotate-90" : ""
                          } ${isSelected ? "text-white/80" : "text-gray-400"}`}
                        >
                          <i className="ri-arrow-right-s-line text-sm" />
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}

                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                          isSelected ? "bg-white/20 text-white" : `${rf.bg} ${rf.color}`
                        }`}
                      >
                        <i className={rf.icon || "ri-folder-line"} />
                      </div>
                      <span className="truncate">{rf.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Actions: Add Subfolder / Edit / Delete */}
                      {canManageDocs && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openNewFolderModal(rf.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-[#253C7D]"
                            }`}
                            title={`Add Subfolder inside ${rf.label}`}
                          >
                            <i className="ri-folder-add-line text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditFolderModal(rf)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                              isSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-gray-500"
                            }`}
                            title="Edit Folder"
                          >
                            <i className="ri-pencil-line text-xs" />
                          </button>
                          {!rf.is_system && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFolder(rf)}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                isSelected ? "hover:bg-rose-500/30 text-rose-200" : "hover:bg-rose-100 text-rose-600"
                              }`}
                              title="Delete Folder"
                            >
                              <i className="ri-delete-bin-line text-xs" />
                            </button>
                          )}
                        </div>
                      )}

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  </div>

                  {/* Nested Subfolders */}
                  {isExpanded && subfolders.length > 0 && (
                    <div className="ml-5 pl-3 border-l-2 border-slate-100 space-y-1 py-0.5">
                      {subfolders.map((sub) => {
                        const isSubSelected = activeCategory === sub.id;
                        const subCount = categoryCounts[sub.id] || 0;

                        return (
                          <div
                            key={sub.id}
                            className={`group/sub flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSubSelected
                                ? "bg-[#253C7D] text-white font-bold shadow-xs"
                                : "text-gray-600 hover:text-gray-900 hover:bg-slate-50"
                            }`}
                            onClick={() => {
                              setActiveCategory(sub.id);
                              setPage(1);
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                  isSubSelected ? "bg-white/20 text-white" : `${sub.bg} ${sub.color}`
                                }`}
                              >
                                <i className={sub.icon || "ri-folder-2-line"} />
                              </div>
                              <span className="truncate">{sub.label}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {canManageDocs && (
                                <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => openEditFolderModal(sub)}
                                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                      isSubSelected ? "hover:bg-white/20 text-white" : "hover:bg-gray-200 text-gray-500"
                                    }`}
                                    title="Edit Subfolder"
                                  >
                                    <i className="ri-pencil-line text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFolder(sub)}
                                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                      isSubSelected ? "hover:bg-rose-500/30 text-rose-200" : "hover:bg-rose-100 text-rose-600"
                                    }`}
                                    title="Delete Subfolder"
                                  >
                                    <i className="ri-delete-bin-line text-xs" />
                                  </button>
                                </div>
                              )}

                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSubSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {subCount}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Filter Pill Box */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block">
              Quick Filter
            </span>
            <div className="space-y-1">
              {[
                { label: "All Document Types", value: null },
                { label: "Templates Only", value: true },
                { label: "Regular Documents", value: false },
              ].map((filterItem) => (
                <button
                  key={String(filterItem.value)}
                  onClick={() => {
                    setFilterTemplate(filterItem.value);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterTemplate === filterItem.value
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-gray-600 hover:bg-slate-50"
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breadcrumb & Subfolder Navigation Bar (Shown when a category/folder is active) */}
          {activeCategory !== "all" && activeFolderObj && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 flex-wrap">
                  <button
                    onClick={() => {
                      setActiveCategory("all");
                      setPage(1);
                    }}
                    className="hover:text-[#253C7D] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-folder-line" />
                    All Documents
                  </button>
                  <i className="ri-arrow-right-s-line text-gray-300" />
                  {activeFolderObj.parent_id && activeParentFolder && (
                    <>
                      <button
                        onClick={() => {
                          setActiveCategory(activeParentFolder.id);
                          setPage(1);
                        }}
                        className="hover:text-[#253C7D] transition-colors cursor-pointer"
                      >
                        {activeParentFolder.label}
                      </button>
                      <i className="ri-arrow-right-s-line text-gray-300" />
                    </>
                  )}
                  <span className="text-gray-900 font-extrabold flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeFolderObj.bg} ${activeFolderObj.color} border border-current inline-block`} />
                    {activeFolderObj.label}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-extrabold">
                    {filtered.length} files
                  </span>
                </div>

                {canManageDocs && (
                  <button
                    onClick={() => openNewFolderModal(activeFolderObj.parent_id || activeFolderObj.id)}
                    className="text-xs font-bold text-[#253C7D] hover:bg-[#253C7D]/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <i className="ri-folder-add-line text-sm" />
                    + New Subfolder
                  </button>
                )}
              </div>

              {/* Subfolder chips / mini-cards */}
              {currentSubfolders.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                    Subfolders:
                  </span>
                  {currentSubfolders.map((sub) => {
                    const isSubActive = activeCategory === sub.id;
                    const count = categoryCounts[sub.id] || 0;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveCategory(sub.id);
                          setPage(1);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSubActive
                            ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                            : "bg-gray-50 hover:bg-slate-100 text-gray-700 border-gray-200/80"
                        }`}
                      >
                        <i className={sub.icon || "ri-folder-2-line"} />
                        <span>{sub.label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSubActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search, Status & View Controls Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search documents by title, author, tag, or description..."
                className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Visibility Filter */}
              <select
                value={visibilityFilter}
                onChange={(e) => {
                  setVisibilityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer"
              >
                <option value="all">All Audiences</option>
                <option value="all_staff">All Staff</option>
                <option value="managers">Managers Only</option>
                <option value="hr_only">HR Only</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "active" | "archived");
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="archived">Archived</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                <button
                  onClick={() => setViewMode("cards")}
                  title="Cards Grid"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-layout-grid-fill" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  title="Table View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-table-line" />
                </button>
              </div>
            </div>
          </div>

          {/* Documents Grid / Table View */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-folder-open-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Documents Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No corporate files match your selected folder, subfolder, filter, or search query.
              </p>
              {canManageDocs && (
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => openNewFolderModal(activeCategory !== "all" ? activeCategory : undefined)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-xs hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    + Create Subfolder
                  </button>
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setForm({
                        title: "",
                        category: activeCategory !== "all" ? activeCategory : (folders[0]?.id || "policy"),
                        subcategory: "",
                        description: "",
                        file_name: "",
                        file_type: "pdf",
                        version: "1.0",
                        visibility: "all",
                        author_name: "HR Team",
                        is_template: false,
                        tags: "",
                      });
                      setShowUploadModal(true);
                    }}
                    className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
                  >
                    + Upload Document Here
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === "cards" ? (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pagedDocs.map((doc) => {
                const typeIcon = FILE_TYPE_ICON[doc.file_type] || "ri-file-line";
                const typeColor = FILE_TYPE_COLOR[doc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
                const vis = VISIBILITY_LABELS[doc.visibility] || VISIBILITY_LABELS.all;
                const folder = folders.find((f) => f.id === doc.category);
                const parentF = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                      doc.status === "archived" ? "opacity-60 bg-gray-50/50" : "border-gray-200/80"
                    } ${selectedDoc?.id === doc.id ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border shrink-0 shadow-2xs ${typeColor}`}
                        >
                          <i className={typeIcon} />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {folder && (
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${folder.bg} ${folder.color} border-current/20 flex items-center gap-1`}
                              title={parentF ? `${parentF.label} / ${folder.label}` : folder.label}
                            >
                              <i className={folder.icon || "ri-folder-line"} />
                              {parentF ? `${parentF.label} / ${folder.label}` : folder.label}
                            </span>
                          )}
                          {doc.is_template && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                              Template
                            </span>
                          )}
                          {doc.status === "archived" && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm line-clamp-2 mb-1.5">
                        {doc.title}
                      </h4>

                      {doc.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${vis.color}`}>
                          {vis.label}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">v{doc.version}</span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-600">{doc.file_type.toUpperCase()}</span>
                        <span>·</span>
                        <span>{formatSize(doc.file_size_kb)}</span>
                      </div>

                      <div className="flex items-center gap-1 font-bold text-gray-600">
                        <i className="ri-download-line text-xs" />
                        <span>{doc.download_count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Document</th>
                      <th className="px-5 py-3.5">Folder</th>
                      <th className="px-5 py-3.5">Visibility</th>
                      <th className="px-5 py-3.5">Version</th>
                      <th className="px-5 py-3.5">Size</th>
                      <th className="px-5 py-3.5">Downloads</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedDocs.map((doc) => {
                      const typeIcon = FILE_TYPE_ICON[doc.file_type] || "ri-file-line";
                      const typeColor = FILE_TYPE_COLOR[doc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
                      const vis = VISIBILITY_LABELS[doc.visibility] || VISIBILITY_LABELS.all;
                      const folder = folders.find((f) => f.id === doc.category);
                      const parentF = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold border shrink-0 shadow-2xs ${typeColor}`}
                              >
                                <i className={typeIcon} />
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-xs sm:text-sm">
                                  {doc.title}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate max-w-xs">{doc.author_name}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                            {parentF ? (
                              <span className="text-gray-400 text-[11px]">
                                {parentF.label} / <strong className="text-gray-800">{folder?.label}</strong>
                              </span>
                            ) : (
                              folder ? folder.label : doc.category
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${vis.color}`}>
                              {vis.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            v{doc.version}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                            {formatSize(doc.file_size_kb)}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                            {doc.download_count}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                doc.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              ● {doc.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleDownload(doc)}
                                className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <i className="ri-download-line text-xs" />
                                Download
                              </button>
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Inspect Details"
                              >
                                <i className="ri-arrow-right-s-line text-base font-bold" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs text-gray-500 font-medium">
                  Showing <span className="font-bold text-gray-900">{docPageStart}</span>–<span className="font-bold text-gray-900">{docPageEnd}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> documents
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-gray-50 font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {[6, 9, 18, 36].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={docSafePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                {pageWindow(docSafePage, docTotalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        p === docSafePage ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(docTotalPages, p + 1))}
                  disabled={docSafePage === docTotalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER: HIGH PRODUCTIVITY DOCUMENT INSPECTION & FILE HUB                  */}
      {/* ========================================================================= */}
      {selectedDoc && (() => {
        const folder = folders.find((f) => f.id === selectedDoc.category);
        const parentFolder = folder?.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;
        const typeColor = FILE_TYPE_COLOR[selectedDoc.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
        const typeIcon = FILE_TYPE_ICON[selectedDoc.file_type] || "ri-file-line";

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedDoc(null)}
            />
            <div className="relative w-full sm:w-[500px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border shrink-0 shadow-2xs ${typeColor}`}>
                    <i className={typeIcon} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <h3 className="text-base font-extrabold text-gray-900 truncate">{selectedDoc.title}</h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-gray-100 text-gray-700">
                        v{selectedDoc.version}
                      </span>
                      {selectedDoc.is_template && (
                        <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
                          Template
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <i className="ri-folder-line text-gray-400" />
                      {parentFolder ? `${parentFolder.label} / ` : ""}
                      <strong className="text-gray-700">{folder?.label || selectedDoc.category}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer shrink-0"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* Quick Action Buttons Strip */}
              <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {selectedDoc.file_url ? (
                    <a
                      href={selectedDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <i className="ri-external-link-line text-emerald-600" />
                      Open Preview
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedDoc)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <i className="ri-file-copy-line text-[#253C7D]" />
                    Copy Link
                  </button>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${selectedDoc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  ● {selectedDoc.status}
                </span>
              </div>

              {/* Sub-Tabs Inside Drawer */}
              <div className="px-5 pt-3 shrink-0">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setDrawerTab("overview")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      drawerTab === "overview"
                        ? "bg-white text-[#253C7D] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-information-line" />
                    <span>File Details</span>
                  </button>

                  <button
                    onClick={() => setDrawerTab("related")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      drawerTab === "related"
                        ? "bg-white text-[#253C7D] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <i className="ri-folder-line" />
                    <span>Folder Files ({relatedDocuments.length + 1})</span>
                  </button>

                  {canManageDocs && (
                    <button
                      onClick={() => setDrawerTab("move")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        drawerTab === "move"
                          ? "bg-white text-[#253C7D] shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <i className="ri-arrow-left-right-line" />
                      <span>Move Folder</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Middle Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* TAB 1: OVERVIEW & METADATA */}
                {drawerTab === "overview" && (
                  <div className="space-y-4">
                    {/* Clean Filename Banner */}
                    <div className="p-3.5 bg-slate-50 border border-gray-200/80 rounded-2xl flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold border shrink-0 ${typeColor}`}>
                        <i className={typeIcon} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-gray-900 truncate">
                          {cleanFileName(selectedDoc.file_name)}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {selectedDoc.file_type.toUpperCase()} File · {formatSize(selectedDoc.file_size_kb)}
                        </p>
                      </div>
                    </div>

                    {/* Description Box */}
                    {selectedDoc.description && (
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Summary & Purpose:
                        </span>
                        <p>{selectedDoc.description}</p>
                      </div>
                    )}

                    {/* Structured Metadata Matrix */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
                      {[
                        {
                          label: "Folder Location",
                          value: (
                            <span className="inline-flex items-center gap-1 font-bold text-[#253C7D]">
                              <i className={folder?.icon || "ri-folder-line"} />
                              {parentFolder ? `${parentFolder.label} / ` : ""}
                              {folder?.label || selectedDoc.category}
                            </span>
                          ),
                        },
                        {
                          label: "Audience Visibility",
                          value: (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${VISIBILITY_LABELS[selectedDoc.visibility]?.color || "bg-gray-100 text-gray-600"}`}>
                              {VISIBILITY_LABELS[selectedDoc.visibility]?.label || selectedDoc.visibility}
                            </span>
                          ),
                        },
                        { label: "Document Version", value: `v${selectedDoc.version}` },
                        { label: "Author / Issuer", value: selectedDoc.author_name },
                        {
                          label: "Status",
                          value: (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${selectedDoc.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              ● {selectedDoc.status}
                            </span>
                          ),
                        },
                        {
                          label: "Created On",
                          value: new Date(selectedDoc.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }),
                        },
                        {
                          label: "Last Modified",
                          value: new Date(selectedDoc.updated_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <span className="text-gray-400 font-medium">{row.label}</span>
                          <span className="font-bold text-gray-800 text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Tags & Topics (Click to search):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDoc.tags.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setSearch(t);
                                setSelectedDoc(null);
                              }}
                              className="text-xs font-bold px-2.5 py-1 bg-white hover:bg-slate-100 border border-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: RELATED FILES IN SAME FOLDER */}
                {drawerTab === "related" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>Files in <strong>{folder?.label || "this folder"}</strong>:</span>
                      <span>{relatedDocuments.length + 1} Total</span>
                    </div>

                    {/* Current File Banner */}
                    <div className="p-3 bg-[#253C7D]/5 border border-[#253C7D]/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${typeColor}`}>
                          <i className={typeIcon} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#253C7D] truncate">{selectedDoc.title}</p>
                          <p className="text-[10px] text-gray-400">Currently Viewing</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#253C7D] text-white rounded-md">
                        Active
                      </span>
                    </div>

                    {/* Other Related Files */}
                    {relatedDocuments.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-8">
                        No other files in this folder yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {relatedDocuments.map((rd) => {
                          const rdColor = FILE_TYPE_COLOR[rd.file_type] || "bg-gray-100 text-gray-600 border-gray-200";
                          const rdIcon = FILE_TYPE_ICON[rd.file_type] || "ri-file-line";
                          return (
                            <div
                              key={rd.id}
                              onClick={() => setSelectedDoc(rd)}
                              className="p-2.5 bg-gray-50 hover:bg-slate-100 rounded-2xl border border-gray-100 flex items-center justify-between transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0 ${rdColor}`}>
                                  <i className={rdIcon} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                                    {rd.title}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {rd.file_type.toUpperCase()} · v{rd.version} · {formatSize(rd.file_size_kb)}
                                  </p>
                                </div>
                              </div>

                              <i className="ri-arrow-right-s-line text-gray-400 text-sm group-hover:text-[#253C7D] transition-colors" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: QUICK RELOCATE FOLDER */}
                {drawerTab === "move" && canManageDocs && (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900">
                      <p className="font-bold flex items-center gap-1 mb-1">
                        <i className="ri-information-line" />
                        Quick Move Destination:
                      </p>
                      <p className="text-[11px] text-blue-700">
                        Select any category or subfolder to immediately reassign this document.
                      </p>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {rootFolders.map((rf) => {
                        const subs = getSubfolders(rf.id);
                        const isCurrentRoot = selectedDoc.category === rf.id;

                        return (
                          <div key={rf.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleQuickMoveFolder(selectedDoc.id, rf.id)}
                              className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isCurrentRoot
                                  ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <i className={rf.icon || "ri-folder-line"} />
                                <span>{rf.label} (Main)</span>
                              </div>
                              {isCurrentRoot && <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full">Current</span>}
                            </button>

                            {subs.map((s) => {
                              const isCurrentSub = selectedDoc.category === s.id;
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleQuickMoveFolder(selectedDoc.id, s.id)}
                                  className={`w-[calc(100%-1.25rem)] ml-5 p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                                    isCurrentSub
                                      ? "bg-[#253C7D] text-white font-bold border-[#253C7D] shadow-xs"
                                      : "bg-gray-50 border-gray-200/80 text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <i className={s.icon || "ri-folder-2-line"} />
                                    <span>↳ {s.label}</span>
                                  </div>
                                  {isCurrentSub && <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-bold">Current</span>}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Fixed Bottom Actions Footer */}
              <div className="p-4 border-t border-gray-100 bg-white space-y-2 shrink-0">
                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="w-full flex items-center justify-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <i className="ri-download-2-line text-sm" />
                  Download Document
                </button>

                {canManageDocs && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openEdit(selectedDoc)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line text-sm" />
                      Edit Details
                    </button>

                    <button
                      onClick={() => handleArchive(selectedDoc)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        selectedDoc.status === "active"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      <i
                        className={`text-sm ${
                          selectedDoc.status === "active" ? "ri-archive-line" : "ri-inbox-unarchive-line"
                        }`}
                      />
                      {selectedDoc.status === "active" ? "Archive" : "Restore"}
                    </button>
                  </div>
                )}

                {canManageDocs && (
                  <button
                    onClick={() => handleDelete(selectedDoc)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                    Move to Recycle Bin
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT FOLDER OR SUBFOLDER                                     */}
      {/* ========================================================================= */}
      {showFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !folderSubmitting && setShowFolderModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
                  <i className={editingFolder ? "ri-folder-settings-line" : folderForm.parentId ? "ri-folder-2-line" : "ri-folder-add-line"} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {editingFolder
                      ? `Edit ${editingFolder.parent_id ? "Subfolder" : "Folder"}`
                      : folderForm.parentId
                      ? "Add New Subfolder"
                      : "Add New Folder"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {folderForm.parentId
                      ? `Create a subfolder inside "${folders.find((f) => f.id === folderForm.parentId)?.label || "parent"}"`
                      : "Create a top-level category folder"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFolderModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveFolder} className="p-5 sm:p-6 space-y-4">
              {/* Parent Folder Hierarchy Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Folder Location / Parent Level
                </label>
                <select
                  value={folderForm.parentId}
                  onChange={(e) => setFolderForm({ ...folderForm, parentId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">📁 None (Top-Level Folder)</option>
                  {rootFolders
                    .filter((rf) => !editingFolder || rf.id !== editingFolder.id)
                    .map((rf) => (
                      <option key={rf.id} value={rf.id}>
                        ↳ Subfolder inside: {rf.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Folder Name */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  {folderForm.parentId ? "Subfolder Name" : "Folder Name"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={folderForm.label}
                  onChange={(e) => setFolderForm({ ...folderForm, label: e.target.value })}
                  placeholder={folderForm.parentId ? "e.g. Standard Operating Procedures (SOPs)..." : "e.g. OPS solutions, Handbooks..."}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FOLDER_COLOR_PRESETS.map((p) => {
                    const isSelected = folderForm.colorPreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFolderForm({ ...folderForm, colorPreset: p.id })}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? `${p.bg} ${p.color} border-current ring-2 ring-current/20 font-black`
                            : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${p.bg} ${p.color} border border-current shrink-0`} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Folder Icon
                </label>
                <div className="grid grid-cols-6 gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-200/80 max-h-32 overflow-y-auto">
                  {AVAILABLE_FOLDER_ICONS.map((iconName) => {
                    const isSelected = folderForm.icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFolderForm({ ...folderForm, icon: iconName })}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-base cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#253C7D] text-white shadow-xs scale-105"
                            : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                        }`}
                      >
                        <i className={iconName} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  placeholder="e.g. SOPs and guidelines for operational workflows"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={folderSubmitting || !folderForm.label.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {folderSubmitting
                    ? "Saving..."
                    : editingFolder
                    ? "Update Folder"
                    : folderForm.parentId
                    ? "Create Subfolder"
                    : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD / EDIT DOCUMENT                                             */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !submitting && setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
                  <i className={editingDoc ? "ri-edit-line" : "ri-upload-cloud-line"} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                    {editingDoc ? "Edit Document Metadata" : "Upload Corporate Document"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editingDoc ? "Update document terms and visibility" : "Add new file to corporate repository"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Employee Code of Conduct & Ethics 2026"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Attach File or Link */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Attach File or Resource
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      if (dropped.size > MAX_FILE_SIZE_BYTES) {
                        toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
                        return;
                      }
                      setFileUpload(dropped);
                    }
                  }}
                  className={`w-full border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-[#253C7D] bg-[#253C7D]/10"
                      : "border-gray-200 hover:border-[#253C7D]/40 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > MAX_FILE_SIZE_BYTES) {
                        toast("File Too Large", `Maximum file size is ${MAX_FILE_SIZE_MB} MB.`, "error");
                        e.target.value = "";
                        return;
                      }
                      setFileUpload(file || null);
                    }}
                  />
                  {fileUpload ? (
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-file-line text-[#253C7D] text-lg" />
                      <span className="text-xs text-gray-800 font-bold">{fileUpload.name}</span>
                      <span className="text-[11px] text-gray-400">({Math.round(fileUpload.size / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileUpload(null);
                          setFileLink("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-gray-400 hover:text-rose-500 ml-1 cursor-pointer"
                      >
                        <i className="ri-close-line" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i
                        className={`text-2xl transition-colors ${
                          dragOver ? "ri-upload-cloud-line text-[#253C7D]" : "ri-upload-cloud-2-line text-gray-400"
                        }`}
                      />
                      <p className="text-xs text-gray-500 font-semibold mt-1">
                        {dragOver ? "Drop your file here" : "Click to browse or drag file here"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 my-2.5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-bold">OR PASTE URL LINK</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="relative">
                  <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="url"
                    value={fileLink}
                    onChange={(e) => setFileLink(e.target.value)}
                    placeholder="https://docs.google.com/... or SharePoint URL"
                    className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                  {fileLink && (
                    <button
                      type="button"
                      onClick={() => setFileLink("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className="ri-close-circle-fill text-xs" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Folder / Subfolder & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Folder / Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        openNewFolderModal();
                      }}
                      className="text-[10px] font-bold text-[#253C7D] hover:underline cursor-pointer"
                    >
                      + New Folder
                    </button>
                  </div>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {rootFolders.map((rf) => {
                      const subs = getSubfolders(rf.id);
                      if (subs.length === 0) {
                        return (
                          <option key={rf.id} value={rf.id}>
                            📁 {rf.label}
                          </option>
                        );
                      }
                      return (
                        <optgroup key={rf.id} label={`📁 ${rf.label}`}>
                          <option value={rf.id}>📁 {rf.label} (Main Folder)</option>
                          {subs.map((s) => (
                            <option key={s.id} value={s.id}>
                              &nbsp;&nbsp;↳ 📂 {s.label}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Section Tag / Note
                  </label>
                  <input
                    type="text"
                    value={form.subcategory}
                    onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    placeholder="e.g. Operations Q3, Guidelines..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Version & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Version
                  </label>
                  <input
                    type="text"
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    placeholder="1.0"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Audience Visibility
                  </label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="all">All Staff</option>
                    <option value="managers">Managers Only</option>
                    <option value="hr_only">HR Only</option>
                  </select>
                </div>
              </div>

              {/* Author & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Author / Issuer
                  </label>
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="policy, ops, 2026"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Summary Description
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary of document purpose and key terms..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Template Checkbox Switch */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-200/60">
                <input
                  type="checkbox"
                  id="templateToggle"
                  checked={form.is_template}
                  onChange={(e) => setForm({ ...form, is_template: e.target.checked })}
                  className="rounded text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
                <label htmlFor="templateToggle" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Mark as Reusable Document Template
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingDoc
                    ? "Save Changes"
                    : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}