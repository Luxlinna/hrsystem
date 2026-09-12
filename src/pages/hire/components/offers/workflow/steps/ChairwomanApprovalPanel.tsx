import { memo } from "react";
import type { BasePanelProps } from "./types";
import { getOfferSignatories } from "@/pages/hire/services/offerLetterService";

export const ChairwomanApprovalPanel = memo(function ChairwomanApprovalPanel({
  offer,
  onExportPdf,
  onExportWord,
}: BasePanelProps) {
  const sigs = getOfferSignatories(offer);

  return (
    <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
          <i className="ri-vip-crown-line text-amber-600 text-base" />
          <span>Chairwoman Supreme Authorization</span>
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

      <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-600">
          <span>1. BU CEO Sign-off:</span>
          <span className="font-bold text-emerald-700">✓ {sigs.bu_ceo.name || "Approved"}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>2. HR Manager Review:</span>
          <span className="font-bold text-emerald-700">✓ {sigs.hr_manager.name || "Approved"}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>3. HR Admin Director:</span>
          <span className="font-bold text-emerald-700">✓ {sigs.hr_director.name || "Approved"}</span>
        </div>
      </div>

      <p className="text-xs text-amber-950 leading-relaxed font-medium">
        Final corporate authorization. Granting supreme authorization authorizes this official offer letter to be issued to the candidate.
      </p>
    </div>
  );
});
