import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Document {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  file_name: string | null;
  file_size_kb: number | null;
  file_type: string;
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
  docx: "ri-file-word-line",
  xlsx: "ri-file-excel-line",
  pptx: "ri-file-ppt-line",
  jpg: "ri-image-line",
  png: "ri-image-line",
};

const FILE_TYPE_COLOR: Record<string, string> = {
  pdf: "bg-red-50 text-red-600",
  docx: "bg-sky-50 text-sky-600",
  xlsx: "bg-green-50 text-green-700",
  pptx: "bg-orange-50 text-orange-600",
  jpg: "bg-violet-50 text-violet-600",
  png: "bg-violet-50 text-violet-600",
};

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  all: { label: "All Staff", color: "bg-emerald-50 text-emerald-700" },
  hr_only: { label: "HR Only", color: "bg-amber-50 text-amber-700" },
  managers: { label: "Managers", color: "bg-violet-50 text-violet-700" },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<boolean | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
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

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDocuments = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDownload = async (doc: Document) => {
    await supabase
      .from("documents")
      .update({ download_count: (doc.download_count || 0) + 1 })
      .eq("id", doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
    );
    showToast("success", `"${doc.title}" download initiated`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setSubmitting(true);
    const tagsArr = form.tags
      ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const { error } = await supabase.from("documents").insert({
      title: form.title,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      file_name: form.file_name || `${form.title.toLowerCase().replace(/\s+/g, "-")}.${form.file_type}`,
      file_type: form.file_type,
      version: form.version,
      visibility: form.visibility,
      author_name: form.author_name,
      is_template: form.is_template,
      tags: tagsArr,
      status: "active",
    });
    setSubmitting(false);
    if (error) {
      showToast("error", "Failed to upload document");
    } else {
      showToast("success", "Document uploaded successfully");
      setShowUploadModal(false);
      setForm({ title: "", category: "policy", subcategory: "", description: "", file_name: "", file_type: "pdf", version: "1.0", visibility: "all", author_name: "HR Team", is_template: false, tags: "" });
      loadDocuments();
    }
  };

  const handleArchive = async (doc: Document) => {
    const newStatus = doc.status === "active" ? "archived" : "active";
    const { error } = await supabase.from("documents").update({ status: newStatus }).eq("id", doc.id);
    if (!error) {
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d)));
      if (selectedDoc?.id === doc.id) setSelectedDoc({ ...selectedDoc, status: newStatus });
      showToast("success", `Document ${newStatus === "archived" ? "archived" : "restored"}`);
    }
  };

  const filtered = documents.filter((d) => {
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
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${toast.type === "success" ? "bg-[#0D7377]" : "bg-red-500"}`}>
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
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap"
          >
            <i className="ri-upload-2-line" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-129px)]">
        {/* Sidebar Categories */}
        <aside className="w-[240px] shrink-0 bg-white border-r border-gray-100 overflow-y-auto p-4">
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#0D7377]/10 text-[#0D7377] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 font-medium"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <i className={cat.icon} />
                  {cat.label}
                </span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? "bg-[#0D7377]/20 text-[#0D7377]" : "bg-gray-100 text-gray-500"}`}>
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
            <div className="bg-[#0D7377]/5 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Total Downloads</span>
                <span className="font-bold text-[#0D7377]">{documents.reduce((s, d) => s + d.download_count, 0).toLocaleString()}</span>
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
        <main className="flex-1 overflow-y-auto p-6">
          {/* Search */}
          <div className="relative mb-6">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search documents by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] placeholder:text-gray-400"
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
                  className={`bg-white border rounded-2xl p-5 cursor-pointer hover:border-[#0D7377]/30 transition-all group ${
                    doc.status === "archived" ? "opacity-60" : "border-gray-100"
                  } ${selectedDoc?.id === doc.id ? "border-[#0D7377]/50 ring-1 ring-[#0D7377]/20" : ""}`}
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
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-[#0D7377] transition-colors">
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
          <aside className="w-[340px] shrink-0 bg-white border-l border-gray-100 overflow-y-auto p-6">
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
                className="w-full flex items-center justify-center gap-2 bg-[#0D7377] text-white py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors cursor-pointer"
              >
                <i className="ri-download-2-line" />
                Download Document
              </button>
              <button
                onClick={() => handleArchive(selectedDoc)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer ${
                  selectedDoc.status === "active"
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <i className={selectedDoc.status === "active" ? "ri-archive-line" : "ri-inbox-unarchive-line"} />
                {selectedDoc.status === "active" ? "Archive Document" : "Restore Document"}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Document Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]"
                  placeholder="e.g. Remote Work Policy 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer">
                    <option value="policy">Policy</option>
                    <option value="contract">Contract</option>
                    <option value="template">Template</option>
                    <option value="compliance">Compliance</option>
                    <option value="benefits">Benefits</option>
                    <option value="training">Training</option>
                    <option value="org">Org Docs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">File Type</label>
                  <select value={form.file_type} onChange={(e) => setForm({ ...form, file_type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer">
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="pptx">PowerPoint</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Subcategory</label>
                  <input type="text" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="e.g. HR Policy" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Version</label>
                  <input type="text" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="1.0" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] resize-none" placeholder="Brief description of the document..." />
                <p className="text-[11px] text-gray-400 mt-0.5">{form.description.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Visibility</label>
                  <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer">
                    <option value="all">All Staff</option>
                    <option value="managers">Managers Only</option>
                    <option value="hr_only">HR Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Author</label>
                  <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="policy, hr, 2026" />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_template: !form.is_template })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_template ? "bg-[#0D7377]" : "bg-gray-200"}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_template ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <label className="text-[13px] text-gray-700 cursor-pointer" onClick={() => setForm({ ...form, is_template: !form.is_template })}>
                  Mark as Template
                </label>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] disabled:opacity-50 cursor-pointer">
                  {submitting ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}