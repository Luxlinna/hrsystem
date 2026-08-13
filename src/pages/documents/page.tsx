import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";

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

const CATEGORIES = [
  { id: "all", label: "All Documents", icon: "ri-folder-line" },
  { id: "policy", label: "Policies", icon: "ri-file-text-line" },
  { id: "contract", label: "Contracts", icon: "ri-draft-line" },
  { id: "template", label: "Templates", icon: "ri-file-copy-line" },
  { id: "compliance", label: "Compliance", icon: "ri-shield-check-line" },
  { id: "benefits", label: "Benefits", icon: "ri-heart-pulse-line" },
  { id: "training", label: "Training", icon: "ri-graduation-cap-line" },
  { id: "org", label: "Org Docs", icon: "ri-organization-chart" },
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
  pdf: "bg-red-50 text-red-600",
  doc: "bg-sky-50 text-sky-600",
  docx: "bg-sky-50 text-sky-600",
  xls: "bg-green-50 text-green-700",
  xlsx: "bg-green-50 text-green-700",
  csv: "bg-green-50 text-green-700",
  ppt: "bg-orange-50 text-orange-600",
  pptx: "bg-orange-50 text-orange-600",
  jpg: "bg-violet-50 text-violet-600",
  jpeg: "bg-violet-50 text-violet-600",
  png: "bg-violet-50 text-violet-600",
  gif: "bg-violet-50 text-violet-600",
  webp: "bg-violet-50 text-violet-600",
  svg: "bg-violet-50 text-violet-600",
  txt: "bg-gray-100 text-gray-600",
  md: "bg-gray-100 text-gray-600",
  json: "bg-amber-50 text-amber-600",
  zip: "bg-yellow-50 text-yellow-600",
  rar: "bg-yellow-50 text-yellow-600",
  mp4: "bg-pink-50 text-pink-600",
  mp3: "bg-pink-50 text-pink-600",
};

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: "All Staff", color: "bg-emerald-50 text-emerald-700" },
  hr_only: { label: "HR Only", color: "bg-amber-50 text-amber-700" },
  managers: { label: "Managers", color: "bg-violet-50 text-violet-700" },
};

export default function DocumentsPage() {
  const { role, isAdmin } = usePermissions();
  // "Staff" is the only documents-module role without management authority —
  // policy/compliance publishing and HR-only/managers-only visibility stay
  // restricted to everyone else.
  const canManageDocs = isAdmin || (!!role && role.name !== "Staff");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<boolean | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
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
  const [submitting, setSubmitting] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDocuments = async () => {
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
    // Restricted-visibility documents shouldn't even be fetched for a
    // non-manager — the `filtered` list below already hides them from the
    // UI, but without this the row (title, description, tags) still landed
    // in the client for every role that can reach this page.
    if (!canManageDocs) query = query.eq("visibility", "all");
    const { data } = await query;
    setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [canManageDocs]);

  const handleDownload = async (doc: Document) => {
    if (doc.file_url) {
      window.open(doc.file_url, "_blank");
    } else {
      showToast("error", "No file attached to this document");
      return;
    }
    await supabase
      .from("documents")
      .update({ download_count: (doc.download_count || 0) + 1 })
      .eq("id", doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !canManageDocs) return;
    setSubmitting(true);
    const tagsArr = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    // Upload file to Supabase Storage if one was selected
    let fileUrl: string | null = null;
    let fileName = form.file_name || `${form.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    let fileSizeKb: number | null = null;
    if (fileUpload) {
      const ext = fileUpload.name.split(".").pop() || "pdf";
      fileName = fileUpload.name;
      fileSizeKb = Math.round(fileUpload.size / 1024);
      const filePath = `documents/${Date.now()}_${fileUpload.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(filePath, fileUpload);
      if (uploadErr) {
        setSubmitting(false);
        showToast("error", "Failed to upload file: " + uploadErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl || null;
      // Derive file_type from the uploaded file extension
      setForm((prev) => ({ ...prev, file_type: ext }));
    } else if (fileLink.trim()) {
      // Use the pasted link as file_url
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
      showToast("error", editingDoc ? "Failed to update document" : "Failed to save document record");
    } else {
      showToast("success", editingDoc ? "Document updated successfully" : "Document uploaded successfully");
      setShowUploadModal(false);
      setEditingDoc(null);
      setForm({ title: "", category: "policy", subcategory: "", description: "", file_name: "", file_type: "pdf", version: "1.0", visibility: "all", author_name: "HR Team", is_template: false, tags: "" });
      setFileUpload(null);
      setFileLink("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadDocuments();
    }
  };

  const handleArchive = async (doc: Document) => {
    if (!canManageDocs) return;
    const newStatus = doc.status === "active" ? "archived" : "active";
    const { error } = await supabase.from("documents").update({ status: newStatus }).eq("id", doc.id);
    if (!error) {
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d)));
      if (selectedDoc?.id === doc.id) setSelectedDoc({ ...selectedDoc, status: newStatus });
      showToast("success", `Document ${newStatus === "archived" ? "archived" : "restored"}`);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!canManageDocs) return;
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      showToast("error", "Failed to delete document");
      return;
    }
    // Also delete the file from storage if it exists
    if (doc.file_url) {
      const filePath = doc.file_url.split("/documents/")[1];
      if (filePath) await supabase.storage.from("documents").remove([filePath]);
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setSelectedDoc(null);
    showToast("success", "Document deleted");
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
    // If the existing file_url is a link (not a storage URL), show it in the link field
    if (doc.file_url && !doc.file_url.includes('/storage/v1/')) {
      setFileLink(doc.file_url);
    } else {
      setFileLink("");
    }
    setShowUploadModal(true);
  };

  const filtered = documents.filter((d) => {
    if (!canManageDocs && (d.visibility === "hr_only" || d.visibility === "managers")) return false;
    if (activeCategory !== "all" && d.category !== activeCategory) return false;
    if (filterTemplate === true && !d.is_template) return false;
    if (filterTemplate === false && d.is_template) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = cat.id === "all" ? documents.length : documents.filter((d) => d.category === cat.id).length;
    return acc;
  }, {});

  const formatSize = (kb: number | null) => {
    if (!kb) return "—";
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Document Management</h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {documents.filter((d) => d.status === "active").length} active documents across {documents.filter((d) => d.is_template).length} templates
            </p>
          </div>
          {canManageDocs && (
            <button
              onClick={() => { setEditingDoc(null); setForm({ title: "", category: "policy", subcategory: "", description: "", file_name: "", file_type: "pdf", version: "1.0", visibility: "all", author_name: "HR Team", is_template: false, tags: "" }); setFileUpload(null); setFileLink(""); if (fileInputRef.current) fileInputRef.current.value = ""; setShowUploadModal(true); }}
              className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap"
            >
              <i className="ri-upload-2-line" />
              Upload Document
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-129px)]">
        {/* Sidebar Categories */}
        <aside className="w-full lg:w-[240px] lg:shrink-0 bg-white border-r border-gray-100 lg:overflow-y-auto p-4">
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#253C7D]/10 text-[#253C7D] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <i className={cat.icon} />
                  {cat.label}
                </span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? "bg-[#253C7D]/20 text-[#253C7D]" : "bg-gray-100 text-gray-500"}`}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 space-y-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Filter</p>
            {[
              { label: "All Types", value: null },
              { label: "Templates Only", value: true },
              { label: "Documents Only", value: false },
            ].map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setFilterTemplate(f.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-[12px] cursor-pointer transition-colors ${
                  filterTemplate === f.value
                    ? "bg-[#1A1A1A] text-white font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1">Stats</p>
            <div className="bg-[#253C7D]/5 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Total Downloads</span>
                <span className="font-bold text-[#253C7D]">{documents.reduce((s, d) => s + d.download_count, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Archived</span>
                <span className="font-bold text-gray-700">{documents.filter((d) => d.status === "archived").length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Templates</span>
                <span className="font-bold text-gray-700">{documents.filter((d) => d.is_template).length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:overflow-y-auto p-6">
          {/* Search */}
          <div className="relative mb-6">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search documents by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="ri-close-line" />
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-[12px] text-gray-400 mb-4">{filtered.length} document{filtered.length !== 1 ? "s" : ""} found</p>

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doc) => {
              const typeIcon = FILE_TYPE_ICON[doc.file_type] || "ri-file-line";
              const typeColor = FILE_TYPE_COLOR[doc.file_type] || "bg-gray-100 text-gray-600";
              const vis = VISIBILITY_LABELS[doc.visibility] || VISIBILITY_LABELS.all;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer hover:border-[#253C7D]/30 transition-all group ${
                    doc.status === "archived" ? "opacity-60" : "border-gray-100"
                  } ${selectedDoc?.id === doc.id ? "border-[#253C7D]/50 ring-1 ring-[#253C7D]/20" : ""}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${typeColor}`}>
                      <i className={`${typeIcon} text-lg`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {doc.is_template && (
                        <span className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-semibold">Template</span>
                      )}
                      {doc.status === "archived" && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">Archived</span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-[#253C7D] transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-3">{doc.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${vis.color}`}>{vis.label}</span>
                      <span className="text-[10px] text-gray-400">v{doc.version}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <i className="ri-download-line text-xs" />
                      <span>{doc.download_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400">{doc.file_type.toUpperCase()}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400">{formatSize(doc.file_size_kb)}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400">{doc.author_name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <i className="ri-folder-open-line text-4xl mb-3" />
              <p className="text-[14px] font-medium">No documents found</p>
              <p className="text-[12px] mt-1">Try adjusting your filters or search term</p>
            </div>
          )}
        </main>

        {/* Detail Panel */}
        {selectedDoc && (
          <aside className="w-full lg:w-[340px] lg:shrink-0 bg-white border-l border-gray-100 lg:overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-gray-900">Document Details</h3>
              <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>

            {/* File Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto ${FILE_TYPE_COLOR[selectedDoc.file_type] || "bg-gray-100 text-gray-600"}`}>
              <i className={`${FILE_TYPE_ICON[selectedDoc.file_type] || "ri-file-line"} text-3xl`} />
            </div>

            <h2 className="text-[15px] font-bold text-gray-900 text-center mb-1">{selectedDoc.title}</h2>
            <p className="text-[12px] text-gray-500 text-center mb-5">{selectedDoc.subcategory || selectedDoc.category}</p>

            {selectedDoc.description && (
              <p className="text-[12px] text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 mb-5">{selectedDoc.description}</p>
            )}

            <div className="space-y-3 mb-6">
              {[
                { label: "File Name", value: selectedDoc.file_name || "—" },
                { label: "File Type", value: selectedDoc.file_type?.toUpperCase() || "—" },
                { label: "File Size", value: formatSize(selectedDoc.file_size_kb) },
                { label: "Version", value: `v${selectedDoc.version}` },
                { label: "Author", value: selectedDoc.author_name },
                { label: "Visibility", value: VISIBILITY_LABELS[selectedDoc.visibility]?.label || selectedDoc.visibility },
                { label: "Downloads", value: selectedDoc.download_count.toString() },
                { label: "Last Updated", value: new Date(selectedDoc.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-gray-400 shrink-0">{row.label}</span>
                  <span className="text-[12px] font-medium text-gray-700 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDoc.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="w-full flex items-center justify-center gap-2 bg-[#253C7D] text-white py-3 rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] shadow-sm transition-all cursor-pointer"
              >
                <i className="ri-download-2-line text-base" />
                Download Document
              </button>
              {canManageDocs && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openEdit(selectedDoc)}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100 transition-all cursor-pointer"
                  >
                    <i className="ri-edit-line text-sm" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleArchive(selectedDoc)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer ${
                      selectedDoc.status === "active"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100"
                    }`}
                  >
                    <i className={`text-sm ${selectedDoc.status === "active" ? "ri-archive-line" : "ri-inbox-unarchive-line"}`} />
                    {selectedDoc.status === "active" ? "Archive" : "Restore"}
                  </button>
                </div>
              )}
              {canManageDocs && (
                <button
                  onClick={() => handleDelete(selectedDoc)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold text-red-500 hover:bg-red-50 border border-red-100 transition-all cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm" />
                  Delete Document
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">{editingDoc ? "Edit Document" : "Upload Document"}</h3>
              <button onClick={() => { setShowUploadModal(false); setEditingDoc(null); setFileUpload(null); setFileLink(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Document Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                  placeholder="e.g. Remote Work Policy 2026"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Attach File</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOver(false);
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) {
                      if (dropped.size > MAX_FILE_SIZE_BYTES) {
                        showToast("error", `File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
                        return;
                      }
                      setFileUpload(dropped);
                    }
                  }}
                  className={`w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-[#253C7D] bg-[#253C7D]/10"
                      : "border-gray-200 hover:border-[#253C7D]/40 hover:bg-[#253C7D]/5"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > MAX_FILE_SIZE_BYTES) {
                        showToast("error", `File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
                        e.target.value = "";
                        return;
                      }
                      setFileUpload(file || null);
                    }}
                  />
                  {fileUpload ? (
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-file-line text-[#253C7D] text-lg" />
                      <span className="text-[13px] text-gray-700 font-medium">{fileUpload.name}</span>
                      <span className="text-[11px] text-gray-400">({Math.round(fileUpload.size / 1024)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFileUpload(null); setFileLink(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-gray-400 hover:text-red-500 ml-1"
                      >
                        <i className="ri-close-line" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i className={`text-2xl transition-colors ${dragOver ? "ri-upload-cloud-line text-[#253C7D]" : "ri-upload-cloud-2-line text-gray-300"}`} />
                      <p className="text-[12px] text-gray-400 mt-1">{dragOver ? "Drop your file here" : "Click to browse or drag a file here"}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[11px] text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Paste Link</label>
                  <div className="relative">
                    <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="url"
                      value={fileLink}
                      onChange={(e) => setFileLink(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                    />
                    {fileLink && (
                      <button
                        type="button"
                        onClick={() => setFileLink("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <i className="ri-close-line" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Link to Google Docs, SharePoint, or any shared URL</p>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 bg-white cursor-pointer transition-all">
                  <option value="policy">Policy</option>
                  <option value="contract">Contract</option>
                  <option value="template">Template</option>
                  <option value="compliance">Compliance</option>
                  <option value="benefits">Benefits</option>
                  <option value="training">Training</option>
                  <option value="org">Org Docs</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all" placeholder="e.g. HR Policy" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Version</label>
                  <input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all" placeholder="1.0" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 resize-none transition-all" placeholder="Brief description of the document..." />
                <p className="text-[11px] text-gray-400 mt-1">{form.description.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Visibility</label>
                  <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 bg-white cursor-pointer transition-all">
                    <option value="all">All Staff</option>
                    <option value="managers">Managers Only</option>
                    <option value="hr_only">HR Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Author</label>
                  <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all" placeholder="policy, hr, 2026" />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_template: !form.is_template })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_template ? "bg-[#253C7D]" : "bg-gray-200"}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_template ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <label className="text-[13px] text-gray-700 cursor-pointer" onClick={() => setForm({ ...form, is_template: !form.is_template })}>
                  Mark as Template
                </label>
              </div>
              <div className="pt-3 flex gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 bg-[#253C7D] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1F336A] shadow-sm disabled:opacity-50 transition-all cursor-pointer">
                  {submitting ? (editingDoc ? "Saving..." : "Uploading...") : (editingDoc ? "Save Changes" : "Upload Document")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}