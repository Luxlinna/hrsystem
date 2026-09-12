import { memo } from "react";
import type { BasePanelProps } from "./types";
import { getOfferSignatories } from "@/pages/hire/services/offerLetterService";

interface HrDirectorApprovalPanelProps extends BasePanelProps {
  checkCompliance: boolean;
  setCheckCompliance: (v: boolean) => void;
  checkTerms: boolean;
  setCheckTerms: (v: boolean) => void;
}

export const HrDirectorApprovalPanel = memo(function HrDirectorApprovalPanel({
  offer,
  onExportPdf,
  onExportWord,
  checkCompliance,
  setCheckCompliance,
  checkTerms,
  setCheckTerms,
}: HrDirectorApprovalPanelProps) {
  const sigs = getOfferSignatories(offer);

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
          <i className="ri-shield-user-line text-indigo-700 text-base" />
          <span>HR Admin Director Authorization</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExportPdf(offer)}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <i className="ri-file-pdf-line text-rose-600" />
            <span>Preview PDF</span>
          </button>
          {onExportWord && (
            <button
              type="button"
              onClick={() => onExportWord(offer)}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className="ri-file-word-line text-sky-600" />
              <span>Word (.docx)</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-600">
          <span>1. BU CEO Sign-off:</span>
          <span className="font-bold text-emerald-700">✓ {sigs.bu_ceo.name || "Approved"}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>2. HR Manager Review:</span>
          <span className="font-bold text-emerald-700">✓ {sigs.hr_manager.name || "Approved"}</span>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed font-medium">
        Review and authorize this recruitment offer letter as HR Admin Director before forwarding to the Chairwoman for supreme sign-off.
      </p>

      <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-slate-200 text-xs">
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkCompliance}
            onChange={(e) => setCheckCompliance(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Corporate HR policy, grading, and compensation verified</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkTerms}
            onChange={(e) => setCheckTerms(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <span>Forward to Chairwoman with full HR Division endorsement</span>
        </label>
      </div>
    </div>
  );
});
