import { memo } from "react";
import type { OfferLetter } from "../../../../types";

interface GenerateDraftPanelProps {
  offer: OfferLetter;
}

export const GenerateDraftPanel = memo(function GenerateDraftPanel({
  offer,
}: GenerateDraftPanelProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
          <i className="ri-file-text-line text-blue-700 text-sm" />
          <span>Form Received by HR Division for Review</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          HR Division
        </span>
      </div>
      <p className="text-xs text-blue-900/90 leading-relaxed font-medium">
        The form has been sent across to the <strong>HR Division for review</strong>. Verify the details below and click <strong>Generate Offer Letter</strong> to compile the official document directly from candidate and requisition records —{" "}
        <span className="font-bold text-blue-950 underline decoration-blue-400 decoration-2">
          no retyping of name, role, salary, or start date
        </span>
        .
      </p>
      <div className="pt-2 border-t border-blue-100 grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
          <span className="text-slate-500 block font-semibold text-[10px] uppercase">Candidate</span>
          <span className="font-bold text-slate-900 truncate block">{offer.candidate_name}</span>
        </div>
        <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
          <span className="text-slate-500 block font-semibold text-[10px] uppercase">Designation</span>
          <span className="font-bold text-slate-900 truncate block">{offer.job_title}</span>
        </div>
        <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
          <span className="text-slate-500 block font-semibold text-[10px] uppercase">Target Start Date</span>
          <span className="font-bold text-slate-900 truncate block">{offer.target_start_date || "To be confirmed"}</span>
        </div>
        <div className="p-2 bg-white/80 rounded-lg border border-blue-100">
          <span className="text-slate-500 block font-semibold text-[10px] uppercase">Department / BU</span>
          <span className="font-bold text-slate-900 truncate block">{offer.department} ({offer.business_unit})</span>
        </div>
      </div>
    </div>
  );
});
