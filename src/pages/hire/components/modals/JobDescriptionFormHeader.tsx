import { memo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { extractJdFromFile, type ExtractedJdData } from "../../utils/jdExtractor";
import { PasteJdModal } from "./PasteJdModal";
import type { NewHiringRequestFormState, JobDescriptionTemplate } from "../../types";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
}

export const JobDescriptionFormHeader = memo(function JobDescriptionFormHeader({ form, setForm }: Props) {
  const [templates, setTemplates] = useState<JobDescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [selectedTplId, setSelectedTplId] = useState<string>(form.jd_template_id || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("job_description_templates").select("*").order("title");
      setTemplates(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const applyExtracted = useCallback((ext: ExtractedJdData) => {
    setForm((p) => ({
      ...p,
      title: p.title || ext.title || p.title,
      jd_summary: ext.job_summary || p.jd_summary,
      jd_responsibilities: ext.responsibilities || p.jd_responsibilities,
      jd_requirements: ext.requirements || p.jd_requirements,
      jd_qualifications: ext.qualifications || p.jd_qualifications,
      jd_reporting_line: ext.reporting_line || p.jd_reporting_line,
      job_description: `${ext.job_summary}\n\nResponsibilities:\n${ext.responsibilities}\n\nRequirements:\n${ext.requirements}\n\nQualifications:\n${ext.qualifications}`,
    }));
  }, [setForm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      applyExtracted(await extractJdFromFile(file));
      toast("JD Auto-filled", `Extracted details from "${file.name}"`, "success");
    } catch (err: any) {
      toast("Extraction Error", err.message || "Failed to parse file", "error");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTplId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const clean = (s?: string | null) => (s || "").replace(/\\n/g, "\n");
    const [resp, req, qual] = [clean(tpl.responsibilities), clean(tpl.requirements), clean(tpl.qualifications)];
    setForm((p) => ({
      ...p,
      title: p.title || tpl.title,
      department: p.department || tpl.department,
      jd_summary: tpl.job_summary,
      jd_responsibilities: resp,
      jd_requirements: req,
      jd_qualifications: qual,
      jd_reporting_line: tpl.reporting_line || (p.hiring_manager_name ? `Reports to: ${p.hiring_manager_name}` : `Reports to: ${tpl.department} Head`),
      jd_template_id: tpl.id,
      job_description: `${tpl.job_summary}\n\nResponsibilities:\n${resp}\n\nRequirements:\n${req}\n\nQualifications:\n${qual}`,
    }));
    toast("Template Applied", `Loaded "${tpl.title}" from JD Library`, "success");
  };

  const handleSaveAsTemplate = async () => {
    if (!form.title.trim() || !form.jd_summary?.trim()) {
      toast("Validation", "Please provide a Position Title and Job Summary first.", "error");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("job_description_templates").insert([{
        title: form.title.trim(),
        department: form.department || "General",
        business_unit: form.business_unit || null,
        job_summary: form.jd_summary || "",
        responsibilities: form.jd_responsibilities || "",
        requirements: form.jd_requirements || "",
        qualifications: form.jd_qualifications || "",
        reporting_line: form.jd_reporting_line || null,
        created_by_name: form.hiring_manager_name || "Manager",
      }]).select().single();
      if (error) throw error;
      toast("Saved to Library", `"${form.title}" is now available in your JD Library!`, "success");
      await loadTemplates();
      if (data?.id) setSelectedTplId(data.id);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1B2B5A] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#253C7D] p-4 sm:p-5 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-lg font-bold shadow-inner">
            <i className="ri-file-list-3-line" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">Job Description & Role Specification</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">Native Module</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-blue-100/80 flex-wrap">
              <span className="font-semibold"><i className="ri-building-line text-blue-300" /> {form.business_unit || "Auto BU"}</span>
              <span>•</span>
              <span className="font-semibold"><i className="ri-folder-user-line text-blue-300" /> {form.department || "Auto Dept"}</span>
              {form.title && (
                <>
                  <span>•</span>
                  <span className="font-bold text-white"><i className="ri-briefcase-line text-blue-300" /> {form.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.rtf,.md" onChange={handleFileUpload} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            title="Upload JD file (PDF, DOCX, TXT) to auto-fill form"
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-blue-500/25 hover:bg-blue-500/40 text-blue-100 text-xs font-extrabold border border-blue-400/40 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <i className={parsing ? "ri-loader-4-line animate-spin text-amber-300" : "ri-file-upload-line text-blue-200"} />
            <span>{parsing ? "Parsing..." : "Upload"}</span>
          </button>

          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            title="Paste raw text of JD to auto-fill form"
            className="px-2.5 sm:px-3 py-2 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-100 text-xs font-extrabold border border-indigo-400/40 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-clipboard-line text-indigo-200" />
            <span>Paste Text</span>
          </button>

          <div className="relative flex-1 sm:w-44">
            <select
              value={selectedTplId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              disabled={loading}
              className="w-full pl-3 pr-8 py-2 bg-white text-gray-800 font-bold text-xs rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="">📋 Library ({templates.length})...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} · {t.department}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={saving || !form.jd_summary}
            title="Save this role specification to the reusable JD Library"
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold border border-white/20 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <i className="ri-bookmark-3-line text-amber-300 text-sm" />
            <span>Save</span>
          </button>
        </div>
      </div>

      <PasteJdModal
        isOpen={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        onApply={(ext) => {
          applyExtracted(ext);
          toast("JD Auto-filled", "Form successfully populated from pasted text!", "success");
        }}
      />
    </div>
  );
});
