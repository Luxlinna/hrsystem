import React from "react";
import { DEFAULT_COMPANY_KHMER, DEFAULT_COMPANY_ENGLISH } from "@/services/formLogoService";

interface FormBrandingHrDivisionSectionProps {
  hrLogo: string;
  khmerName: string;
  setKhmerName: (val: string) => void;
  englishName: string;
  setEnglishName: (val: string) => void;
  hasHrChanges: boolean;
  isHrCustom: boolean;
  saving: boolean;
  onUploadClick: () => void;
  onSaveHr: () => void;
  onResetHr: () => void;
}

export function FormBrandingHrDivisionSection({
  hrLogo,
  khmerName,
  setKhmerName,
  englishName,
  setEnglishName,
  hasHrChanges,
  isHrCustom,
  saving,
  onUploadClick,
  onSaveHr,
  onResetHr,
}: FormBrandingHrDivisionSectionProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-shield-check-fill text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Official Document Branding &mdash; HR Division (UNI Logo)
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#253C7D] dark:bg-blue-900/60 dark:text-blue-200">
                HR Division Scope
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Exported forms and letters generated for the <strong>HR Division</strong> strictly use the official <strong>UNI Holding Logo</strong> and registered corporate legal names.
            </p>
          </div>
        </div>
      </div>

      {/* HR Logo Preview & Actions */}
      <div className="p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img src={hrLogo} alt="HR Division Logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#253C7D] dark:text-blue-400 block font-['Kantumruy_Pro']">
                {khmerName || DEFAULT_COMPANY_KHMER}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#253C7D] dark:bg-blue-900/60 dark:text-blue-200">
                HR Division Only
              </span>
            </div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
              {englishName || DEFAULT_COMPANY_ENGLISH}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
              Applied strictly to Offer Letters, Evaluation Results, and HR Approval Forms for the HR Division.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onUploadClick}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-upload-2-line text-sm text-[#253C7D] dark:text-blue-400" />
            Upload New HR Logo
          </button>

          {isHrCustom && (
            <button
              type="button"
              onClick={onResetHr}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <i className="ri-refresh-line text-sm" />
              Reset to UNI Default
            </button>
          )}
        </div>
      </div>

      {/* Official Company Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Official Company Name (Khmer) &mdash; HR Division
          </label>
          <input
            type="text"
            value={khmerName}
            onChange={(e) => setKhmerName(e.target.value)}
            placeholder="យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក"
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Official Company Name (English) &mdash; HR Division
          </label>
          <input
            type="text"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
            placeholder="Unique Noble Investment Co. Ltd."
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasHrChanges && (
        <div className="pt-2 flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900">
          <span className="text-xs text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
            <i className="ri-information-line" /> You have unsaved HR branding changes.
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={onSaveHr}
            className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
            Save HR Branding
          </button>
        </div>
      )}
    </div>
  );
}
