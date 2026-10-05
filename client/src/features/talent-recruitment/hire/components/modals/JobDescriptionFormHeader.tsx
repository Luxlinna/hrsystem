import { memo } from "react";
import { toast } from "@/components/Toast";
import { PasteJdModal } from "./PasteJdModal";
import { ManageJdTemplatesModal } from "./ManageJdTemplatesModal";
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
    manageModalOpen,
    setManageModalOpen,
    loadTemplates,
    selectedTplId,
    fileInputRef,
    applyExtracted,
    handleFileUpload,
    handleApplyTemplate,
    handleSaveAsTemplate,
  } = useJobDescriptionHeader(form, setForm);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 px-3 py-2 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left Side: Company & Job Title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Company */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 text-xs shrink-0 shadow-2xs">
              <i className="ri-building-line" />
            </div>
            <div>
              <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider">Company</p>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">
                {form.business_unit || form.company || "OPS SOLUTIONS CO., LTD"}
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden md:block" />

          {/* Job Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 text-xs shrink-0 shadow-2xs">
              <i className="ri-briefcase-line" />
            </div>
            <div>
              <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider">Job Title</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-900 leading-tight">
                  {form.title || form.position || "Senior Operations Officer"}
                </span>
                <span className="px-1.5 py-0.2 rounded-md text-[8.5px] font-bold bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs">
                  Draft
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Actions (Use existing JD, Manage Library, Upload file, Paste text) */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* Use existing JD Select */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedTplId}
              onChange={(e) => handleApplyTemplate(e.target.value)}
              disabled={loading}
              className="w-full pl-2.5 pr-6 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-[11px] rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none transition-all"
            >
              <option value="">Use existing JD</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.department})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>

          {/* Manage JD Library / Setting for Super Admin */}
          <button
            type="button"
            onClick={() => setManageModalOpen(true)}
            title="Super Admin JD Library & Templates Control"
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-settings-4-line text-slate-600 text-xs" />
            <span className="hidden sm:inline">JD Library</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.rtf,.md,.png,.jpg,.jpeg,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Upload file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <i className={parsing ? "ri-loader-4-line animate-spin text-blue-600 text-xs" : "ri-upload-2-line text-slate-600 text-xs"} />
            <span>{parsing ? "Parsing..." : "Upload file"}</span>
          </button>

          {/* Paste text */}
          <button
            type="button"
            onClick={() => setPasteModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <i className="ri-file-text-line text-slate-600 text-xs" />
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

      <ManageJdTemplatesModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        templates={templates}
        onRefresh={loadTemplates}
        onSelectTemplate={handleApplyTemplate}
      />
    </div>
  );
});

