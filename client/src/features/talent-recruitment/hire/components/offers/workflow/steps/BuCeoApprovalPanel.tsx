import { memo } from "react";
import type { OfferLetter } from "../../../../types";

interface BuCeoApprovalPanelProps {
  offer: OfferLetter;
  checkTerms: boolean;
  setCheckTerms: (v: boolean) => void;
  checkRemuneration: boolean;
  setCheckRemuneration: (v: boolean) => void;
  checkCompliance: boolean;
  setCheckCompliance: (v: boolean) => void;
}

export const BuCeoApprovalPanel = memo(function BuCeoApprovalPanel({
  offer,
  checkTerms,
  setCheckTerms,
  checkRemuneration,
  setCheckRemuneration,
  checkCompliance,
  setCheckCompliance,
}: BuCeoApprovalPanelProps) {
  return (
    <div className="p-4 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
          <i className="ri-user-star-line text-blue-700 text-base" />
          <span>BU CEO Operational Authorization Checklist</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          {offer.business_unit || "Operational BU"}
        </span>
      </div>
      <p className="text-xs text-blue-900/80 leading-relaxed font-medium">
        As the CEO / Division Director of <strong>{offer.business_unit}</strong>, verify that this remuneration proposal fits within your operational headcount budget before forwarding to the HR Division.
      </p>
      <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-blue-100 text-xs">
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkTerms}
            onChange={(e) => setCheckTerms(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span>Designation ({offer.job_title}) and department ({offer.department}) approved for BU operations</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkRemuneration}
            onChange={(e) => setCheckRemuneration(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span>Base salary (${offer.base_salary.toLocaleString()}) and package authorized within operational budget</span>
        </label>
        <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={checkCompliance}
            onChange={(e) => setCheckCompliance(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span>Authorize submission to HR Division for compliance review and formal offer letter creation</span>
        </label>
      </div>
    </div>
  );
});
