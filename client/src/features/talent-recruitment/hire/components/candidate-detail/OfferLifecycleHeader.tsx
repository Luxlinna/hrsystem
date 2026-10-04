import { memo } from "react";
import type { OfferLetter } from "../../types";

interface OfferLifecycleHeaderProps {
  offer: OfferLetter | null;
  isQualificationBased: boolean;
  totalAllowances: number;
  totalPackage: number;
  onOpenCreateProposal: () => void;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

export const OfferLifecycleHeader = memo(function OfferLifecycleHeader({
  offer,
  isQualificationBased,
  totalAllowances,
  totalPackage,
  onOpenCreateProposal,
  onExportPdf,
  onExportWord,
}: OfferLifecycleHeaderProps) {
  return (
    <>
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#172B4D] via-[#1E3A6D] to-[#253C7D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-2xl text-blue-200 shrink-0 border border-white/10 shadow-inner">
            <i className="ri-award-line" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold tracking-tight">Offer & Compensation Lifecycle</h3>
              {offer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 border border-white/20 text-white">
                  {offer.offer_number}
                </span>
              )}
              {isQualificationBased && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Based on qualification
                </span>
              )}
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Structured 6-stage recruitment offer progression from initial proposal to confirmed candidate decision.
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center gap-2 shrink-0">
          {offer && ["approved", "issued", "accepted"].includes(offer.status) && (
            <>
              {onExportWord && (
                <button
                  type="button"
                  onClick={() => onExportWord(offer)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer backdrop-blur-xs"
                  title="Download official employment offer letter Word (.docx)"
                >
                  <i className="ri-file-word-line text-sm text-sky-200" />
                  <span>Offer Word</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onExportPdf(offer)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer backdrop-blur-xs"
                title="Download or print official employment offer letter PDF"
              >
                <i className="ri-file-pdf-line text-sm text-red-300" />
                <span>Offer PDF</span>
              </button>
            </>
          )}

          {!offer && (
            <button
              type="button"
              onClick={onOpenCreateProposal}
              className="px-4 py-2 rounded-xl bg-white text-[#172B4D] hover:bg-blue-50 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              <span>Create Salary Proposal</span>
            </button>
          )}
        </div>
      </div>

      {/* Salary Summary Strip if Offer Exists */}
      {offer && (
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Base Salary</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ${offer.base_salary.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ mo</span>
              </span>
            </div>
            {offer.probation_salary && (
              <div className="border-l border-blue-200/60 pl-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  Probation Salary ({offer.probation_months} mo)
                </span>
                <span className="font-bold text-slate-800">
                  ${offer.probation_salary.toLocaleString()} <span className="text-[11px] text-slate-500 font-normal">/ mo</span>
                </span>
              </div>
            )}
            {totalAllowances > 0 && (
              <div className="border-l border-blue-200/60 pl-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Monthly Allowances</span>
                <span className="font-bold text-slate-800">+${totalAllowances.toLocaleString()}</span>
              </div>
            )}
            <div className="border-l border-blue-200/60 pl-4">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Joining Date</span>
              <span className="font-bold text-slate-900">
                {offer.target_start_date ? new Date(offer.target_start_date).toLocaleDateString() : "To be confirmed"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200">
              Total Monthly Remuneration: <strong className="font-black text-slate-950">${totalPackage.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}
    </>
  );
});
