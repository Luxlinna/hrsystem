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
    <div className="bg-white rounded-2xl border border-slate-200/90 px-3.5 py-2.5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Company & Job Title */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap">
          {/* Company */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 text-sm shrink-0 shadow-2xs">
              <i className="ri-building-line" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Company</p>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {form.business_unit || form.company || "OPS SOLUTIONS CO., LTD"}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* Job Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 text-sm shrink-0 shadow-2xs">
              <i className="ri-briefcase-line" />
            </div>
            <div>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Job Title</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {form.title || form.position || "Senior Operations Officer"}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs">
                  Draft
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Actions matching image (Use existing JD, Upload file, Paste text) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Use existing JD Select */}
          <div className="relative min-w-[145px]">
            <select
              value={selectedTplId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              disabled={loading}
              className="w-full pl-3 pr-7 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none transition-all"
            >
              <option value="">Use existing JD</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.department})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.rtf,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Upload file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <i className={parsing ? "ri-loader-4-line animate-spin text-blue-600" : "ri-upload-2-line text-slate-600 text-sm"} />
            <span>{parsing ? "Parsing..." : "Upload file"}</span>
          </button>

          {/* Paste text */}
          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-text-line text-slate-600 text-sm" />
            <span>Paste text</span>
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
