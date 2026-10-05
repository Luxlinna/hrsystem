import { memo, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { JobDescriptionTemplate } from "../../types";

interface ManageJdTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: JobDescriptionTemplate[];
  onRefresh: () => Promise<void>;
  onSelectTemplate?: (templateId: string) => void;
  isSuperAdmin?: boolean;
}

export const ManageJdTemplatesModal = memo(function ManageJdTemplatesModal({
  isOpen,
  onClose,
  templates,
  onRefresh,
  onSelectTemplate,
  isSuperAdmin = true,
}: ManageJdTemplatesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit / Create Form State
  const [editForm, setEditForm] = useState<{
    id?: string;
    title: string;
    department: string;
    business_unit: string;
    job_summary: string;
    responsibilities: string;
    requirements: string;
    qualifications: string;
    reporting_line: string;
  }>({
    title: "",
    department: "General",
    business_unit: "OPS SOLUTIONS CO., LTD",
    job_summary: "",
    responsibilities: "",
    requirements: "",
    qualifications: "",
    reporting_line: "",
  });

  const departments = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.business_unit || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.job_summary || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === "all" || t.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [templates, searchQuery, selectedDept]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || null;
  }, [templates, selectedTemplateId, filteredTemplates]);

  const handleStartEdit = (tpl: JobDescriptionTemplate) => {
    setEditForm({
      id: tpl.id,
      title: tpl.title || "",
      department: tpl.department || "General",
      business_unit: tpl.business_unit || "OPS SOLUTIONS CO., LTD",
      job_summary: tpl.job_summary || "",
      responsibilities: tpl.responsibilities || "",
      requirements: tpl.requirements || "",
      qualifications: tpl.qualifications || "",
      reporting_line: tpl.reporting_line || "",
    });
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const handleStartCreate = () => {
    setEditForm({
      title: "",
      department: "Human Resources",
      business_unit: "OPS SOLUTIONS CO., LTD",
      job_summary: "",
      responsibilities: "",
      requirements: "",
      qualifications: "",
      reporting_line: "",
    });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast("Validation", "Please enter a Job Title for the template.", "error");
      return;
    }
    setSaving(true);
    try {
      if (isCreatingNew) {
        const { data, error } = await supabase
          .from("job_description_templates")
          .insert([
            {
              title: editForm.title.trim(),
              department: editForm.department || "General",
              business_unit: editForm.business_unit || null,
              job_summary: editForm.job_summary || "",
              responsibilities: editForm.responsibilities || "",
              requirements: editForm.requirements || "",
              qualifications: editForm.qualifications || "",
              reporting_line: editForm.reporting_line || null,
              created_by_name: "Super Admin",
              version: 1,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        toast("Template Created", `Added "${editForm.title}" to JD Library.`, "success");
        await onRefresh();
        if (data?.id) setSelectedTemplateId(data.id);
      } else if (editForm.id) {
        const { error } = await supabase
          .from("job_description_templates")
          .update({
            title: editForm.title.trim(),
            department: editForm.department || "General",
            business_unit: editForm.business_unit || null,
            job_summary: editForm.job_summary || "",
            responsibilities: editForm.responsibilities || "",
            requirements: editForm.requirements || "",
            qualifications: editForm.qualifications || "",
            reporting_line: editForm.reporting_line || null,
          })
          .eq("id", editForm.id);
        if (error) throw error;
        toast("Template Updated", `Changes to "${editForm.title}" saved.`, "success");
        await onRefresh();
      }
      setIsEditing(false);
      setIsCreatingNew(false);
    } catch (err: any) {
      toast("Save Failed", err.message || "Could not save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("job_description_templates").delete().eq("id", id);
      if (error) throw error;
      toast("Deleted", "Job Description template removed from library.", "success");
      setDeleteConfirmId(null);
      await onRefresh();
      if (selectedTemplateId === id) {
        setSelectedTemplateId("");
      }
    } catch (err: any) {
      toast("Delete Error", err.message || "Failed to delete template", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleApply = (tpl: JobDescriptionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E3064] text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-xl shrink-0">
              <i className="ri-book-open-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Job Description (JD) Library &amp; Templates</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {isSuperAdmin ? "Super Admin Control" : "JD Master Library"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Centralized library of standardized position job descriptions across all business units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartCreate}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              <span>Create New JD</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Left Panel: Template List */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
            {/* Search & Filter */}
            <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search template title, BU..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Departments ({templates.length})</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredTemplates.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <i className="ri-file-search-line text-3xl mb-2 text-slate-300 block" />
                  <p className="text-xs font-semibold">No JD templates found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try another search or create a new template.</p>
                </div>
              ) : (
                filteredTemplates.map((t) => {
                  const isSelected = selectedTemplate?.id === t.id && !isCreatingNew;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        setIsEditing(false);
                        setIsCreatingNew(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative group ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-300 shadow-2xs"
                          : "bg-white hover:bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium mt-0.5">
                            <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                              {t.department || "General"}
                            </span>
                            {t.business_unit && <span className="truncate max-w-[120px]">• {t.business_unit}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(t);
                            }}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-blue-600 text-xs"
                            title="Edit template"
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(t.id);
                            }}
                            className="p-1 rounded-md hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-xs"
                            title="Delete template"
                          >
                            <i className="ri-delete-bin-line" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>{templates.length} total templates</span>
              <span className="font-semibold text-slate-700">Supabase synced</span>
            </div>
          </div>

          {/* Right Panel: Template Viewer / Editor */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {isEditing ? (
              /* Editor Form */
              <form onSubmit={handleSaveTemplate} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isCreatingNew ? "Create New JD Template" : `Edit Template: ${editForm.title}`}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreatingNew(false);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel Editing
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Job Position Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g. Senior Talent Acquisition Specialist"
                        className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        placeholder="e.g. Human Resources"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Business Unit / Company
                      </label>
                      <input
                        type="text"
                        value={editForm.business_unit}
                        onChange={(e) => setEditForm({ ...editForm, business_unit: e.target.value })}
                        placeholder="e.g. OPS SOLUTIONS CO., LTD"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Reporting Line
                      </label>
                      <input
                        type="text"
                        value={editForm.reporting_line}
                        onChange={(e) => setEditForm({ ...editForm, reporting_line: e.target.value })}
                        placeholder="e.g. Reports to: Head of Talent Acquisition"
                        className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Job Summary / Purpose
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.job_summary}
                      onChange={(e) => setEditForm({ ...editForm, job_summary: e.target.value })}
                      placeholder="Brief summary of the role's mission and scope..."
                      className="w-full p-3 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Key Responsibilities (One item per line)
                      </label>
                      <textarea
                        rows={6}
                        value={editForm.responsibilities}
                        onChange={(e) => setEditForm({ ...editForm, responsibilities: e.target.value })}
                        placeholder="• Lead end-to-end recruitment cycle&#10;• Partner with hiring managers&#10;• Screen and interview top talent"
                        className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Skills &amp; Requirements (One item per line)
                      </label>
                      <textarea
                        rows={6}
                        value={editForm.requirements}
                        onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
                        placeholder="• 3+ years experience in recruiting&#10;• Strong communication skills&#10;• Proficient in ATS and job boards"
                        className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Qualifications &amp; Education
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.qualifications}
                      onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                      placeholder="• Bachelor's Degree in Human Resources, Business, or related field"
                      className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Footer Save Actions */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving && <i className="ri-loader-4-line animate-spin" />}
                    <span>{isCreatingNew ? "Save to Library" : "Update Template"}</span>
                  </button>
                </div>
              </form>
            ) : selectedTemplate ? (
              /* Preview Mode */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Preview Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4 shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">{selectedTemplate.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {selectedTemplate.department || "General"}
                      </span>
                      {selectedTemplate.version && (
                        <span className="text-[10px] text-slate-400 font-mono">v{selectedTemplate.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedTemplate.business_unit || "OPS SOLUTIONS CO., LTD"}{" "}
                      {selectedTemplate.reporting_line ? `• ${selectedTemplate.reporting_line}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectTemplate && (
                      <button
                        type="button"
                        onClick={() => handleApply(selectedTemplate)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="ri-check-line text-sm" />
                        <span>Apply to Form</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(selectedTemplate)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="ri-edit-line text-xs" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(selectedTemplate.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete template"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Job Summary */}
                  {selectedTemplate.job_summary && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <i className="ri-file-text-line text-blue-600" />
                        <span>Job Summary &amp; Purpose</span>
                      </h4>
                      <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                        {selectedTemplate.job_summary}
                      </p>
                    </div>
                  )}

                  {/* Responsibilities */}
                  {selectedTemplate.responsibilities && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <i className="ri-list-check-2 text-indigo-600" />
                        <span>Key Responsibilities</span>
                      </h4>
                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-800 space-y-1">
                        {selectedTemplate.responsibilities.split("\n").map((line, i) => (
                          <p key={i} className="leading-relaxed">
                            {line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requirements & Skills */}
                  {selectedTemplate.requirements && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <i className="ri-medal-line text-amber-600" />
                        <span>Requirements &amp; Core Skills</span>
                      </h4>
                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-800 space-y-1">
                        {selectedTemplate.requirements.split("\n").map((line, i) => (
                          <p key={i} className="leading-relaxed">
                            {line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qualifications */}
                  {selectedTemplate.qualifications && (
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <i className="ri-graduation-cap-line text-emerald-600" />
                        <span>Qualifications &amp; Education</span>
                      </h4>
                      <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                        {selectedTemplate.qualifications}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <i className="ri-book-read-line text-4xl text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Template Selected</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Select a Job Description template from the left list to preview, or create a brand new template.
                </p>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
                <i className="ri-delete-bin-line" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-900">Delete JD Template?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  This template will be permanently removed from the JD Library.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDeleteTemplate(deleteConfirmId)}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
