import { memo } from "react";
import type { BasePanelProps } from "./types";

interface HrManagerApprovalPanelProps extends BasePanelProps {
  checkTerms: boolean;
  setCheckTerms: (v: boolean) => void;
  checkRemuneration: boolean;
  setCheckRemuneration: (v: boolean) => void;
  checkProbation: boolean;
  setCheckProbation: (v: boolean) => void;
  checkCompliance: boolean;
  setCheckCompliance: (v: boolean) => void;
  hrReviewer: string;
  setHrReviewer: (v: string) => void;
}

export const HrManagerApprovalPanel = memo(function HrManagerApprovalPanel({
  offer,
  onExportPdf,
  onExportWord,
  checkTerms,
  setCheckTerms,
  checkRemuneration,
  setCheckRemuneration,
  checkProbation,
  setCheckProbation,
  checkCompliance,
  setCheckCompliance,
  hrReviewer,
  setHrReviewer,
}: HrManagerApprovalPanelProps) {
  return (
    <div className="p-4 bg-indigo-50/70 border border-indigo-200/90 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950">
          <i className="ri-shield-check-line text-indigo-600 text-base" />
          <span>HR Manager Review &amp; Verification Checklist</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExportPdf(offer)}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Preview or print the generated offer letter PDF"
          >
            <i className="ri-file-pdf-line text-rose-600" />
            <span>Preview Offer PDF</span>
          </button>
          {onExportWord && (
            <button
              type="button"
              onClick={() => onExportWord(offer)}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download offer letter Word document"
            >
              <i className="ri-file-word-line text-sky-600" />
              <span>Word (.docx)</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
        The offer letter draft has been compiled from candidate and requisition records. Please verify compliance, review clauses, and sign off as HR Manager before forwarding to the HR Admin Director.
      </p>

      <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-indigo-100 text-xs">
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkTerms}
            onChange={(e) => setCheckTerms(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Candidate name, designation &amp; department match approved requisition</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkRemuneration}
            onChange={(e) => setCheckRemuneration(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Base salary (${offer.base_salary.toLocaleString()}) and allowances match approved proposal</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkProbation}
            onChange={(e) => setCheckProbation(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Probation period ({offer.probation_months} months) and standard employment clauses verified</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkCompliance}
            onChange={(e) => setCheckCompliance(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>All compliance standards met; endorsed for HR Admin Director authorization</span>
        </label>
      </div>

      <div className="pt-1">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
          Reviewing HR Manager <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={hrReviewer}
          onChange={(e) => setHrReviewer(e.target.value)}
          placeholder="e.g. Ms. Chea TiengChanvathna"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
        />
      </div>
    </div>
  );
});
