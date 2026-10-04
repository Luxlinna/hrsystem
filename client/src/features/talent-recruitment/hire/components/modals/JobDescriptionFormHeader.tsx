import { memo } from "react";
import { toast } from "@/components/Toast";
import { PasteJdModal } from "./PasteJdModal";
import { useJobDescriptionHeader } from "../../hooks/useJobDescriptionHeader";
import type { NewHiringRequestFormState } from "../../types";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
}

export const JobDescriptionFormHeader = memo(function JobDescriptionFormHeader({ form, setForm }: Props) {
  const {
    templates,
    loading,
    saving,
    parsing,
    pasteModalOpen,
    setPasteModalOpen,
    selectedTplId,
    fileInputRef,
    applyExtracted,
    handleFileUpload,
    handleApplyTemplate,
    handleSaveAsTemplate,
  } = useJobDescriptionHeader(form, setForm);

  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] p-4 sm:p-5 text-white">
      {/* Top Header: Title, Icon, Meta Tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300 text-lg font-bold shadow-inner shrink-0">
            <i className="ri-file-list-3-line" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Job Description & Role Specification
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                ✨ Smart Role Spec
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-blue-100/80 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 text-white">
                <i className="ri-building-line text-blue-300" /> {form.business_unit || "Select BU"}
              </span>
              {form.department && (
                <span className="inline-flex items-center gap-1 font-semibold bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 text-blue-200">
                  <i className="ri-folder-user-line text-blue-300" /> {form.department}
                </span>
              )}
              {form.title && (
                <span className="inline-flex items-center gap-1 font-bold text-white bg-blue-500/25 px-2 py-0.5 rounded-lg border border-blue-400/40">
                  <i className="ri-briefcase-line text-blue-300" /> {form.title}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <i className="ri-book-read-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <select
            value={selectedTplId}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            disabled={loading}
            className="w-full pl-8 pr-8 py-2 bg-white text-gray-800 font-bold text-xs rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            <option value="">📋 Reusable JD Library ({templates.length})...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} · {t.department}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.rtf,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            title="Upload JD file (PDF, DOCX, TXT) to auto-fill form"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <i className={parsing ? "ri-loader-4-line animate-spin text-amber-300" : "ri-file-upload-line text-blue-200"} />
            <span>{parsing ? "Parsing..." : "Upload File"}</span>
          </button>

          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            title="Paste raw text of JD to auto-fill form"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-clipboard-line text-indigo-200" />
            <span>Paste Text</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsTemplate}
            disabled={saving || !form.jd_summary}
            title="Save this role specification to the reusable JD Library"
            className="px-3 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-xs font-bold border border-amber-400/40 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="ri-save-line text-amber-300 text-sm" />
            <span>Save to Library</span>
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
