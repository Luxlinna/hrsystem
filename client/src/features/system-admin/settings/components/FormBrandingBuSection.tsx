import React from "react";
import { DEFAULT_BU_COMPANY_NAME } from "@/services/formLogoService";

interface FormBrandingBuSectionProps {
  effectiveBranchName: string;
  buLogo: string;
  buCompanyName: string;
  setBuCompanyName: (val: string) => void;
  hasBuChanges: boolean;
  isBuCustom: boolean;
  saving: boolean;
  onUploadClick: () => void;
  onSaveBu: () => void;
  onResetBu: () => void;
}

export function FormBrandingBuSection({
  effectiveBranchName,
  buLogo,
  buCompanyName,
  setBuCompanyName,
  hasBuChanges,
  isBuCustom,
  saving,
  onUploadClick,
  onSaveBu,
  onResetBu,
}: FormBrandingBuSectionProps) {
  const buLabel = effectiveBranchName || "Business Unit";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-building-4-fill text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Official Document Branding &mdash; {buLabel}
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {buLabel} Scope
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Exported documents generated for <strong>{buLabel}</strong> strictly use its own designated BU logo and corporate entity name.
            </p>
          </div>
        </div>
      </div>

      {/* BU Logo Preview & Actions */}
      <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img src={buLogo} alt={`${buLabel} Logo`} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                {buCompanyName || effectiveBranchName || DEFAULT_BU_COMPANY_NAME}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                Active BU
              </span>
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block">
              Automatically embedded on offer letters, interview evaluations, and approvals for {buLabel}.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={onUploadClick}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-upload-2-line text-sm text-emerald-600 dark:text-emerald-400" />
            Upload New {effectiveBranchName || "BU"} Logo
          </button>

          {isBuCustom && (
            <button
              type="button"
              onClick={onResetBu}
              disabled={saving}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <i className="ri-refresh-line text-sm" />
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {/* BU Company Name */}
      <div>
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
          Business Unit / Operational Company Name
        </label>
        <input
          type="text"
          value={buCompanyName}
          onChange={(e) => setBuCompanyName(e.target.value)}
          placeholder={effectiveBranchName || "OPS SOLUTIONS CO., LTD."}
          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Used as the official company/entity name on offer letters and documents issued for {buLabel}.
        </p>
      </div>

      {/* Unsaved Changes Banner */}
      {hasBuChanges && (
        <div className="pt-2 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <i className="ri-information-line" /> You have unsaved Business Unit branding changes.
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={onSaveBu}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
            Save BU Branding
          </button>
        </div>
      )}
    </div>
  );
}
