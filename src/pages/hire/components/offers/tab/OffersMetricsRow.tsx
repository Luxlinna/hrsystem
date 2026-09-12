import { memo } from "react";

export interface OfferMetrics {
  total: number;
  inReview: number;
  readyToIssue: number;
  issued: number;
  accepted: number;
  rejected: number;
}

interface OffersMetricsRowProps {
  metrics: OfferMetrics;
}

export const OffersMetricsRow = memo(function OffersMetricsRow({ metrics }: OffersMetricsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
          Total Offers
        </span>
        <span className="text-2xl font-black text-slate-900 mt-1 block">{metrics.total}</span>
        <span className="text-[11px] text-slate-500 font-medium">Recorded in system</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider block">
          In Approval
        </span>
        <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.inReview}</span>
        <span className="text-[11px] text-amber-600 font-medium">Steps 1–5 in review</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider block">
          Ready to Issue
        </span>
        <span className="text-2xl font-black text-[#253C7D] mt-1 block">{metrics.readyToIssue}</span>
        <span className="text-[11px] text-blue-600 font-medium">Authorized by Mgmt</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-sky-200/80 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-sky-600 tracking-wider block">
          Issued / Pending
        </span>
        <span className="text-2xl font-black text-sky-700 mt-1 block">{metrics.issued}</span>
        <span className="text-[11px] text-sky-600 font-medium">Awaiting response</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-teal-200/80 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-teal-600 tracking-wider block">
          Accepted
        </span>
        <span className="text-2xl font-black text-teal-700 mt-1 block">{metrics.accepted}</span>
        <span className="text-[11px] text-teal-600 font-medium">Ready for onboarding</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider block">
          Declined
        </span>
        <span className="text-2xl font-black text-rose-700 mt-1 block">{metrics.rejected}</span>
        <span className="text-[11px] text-slate-500 font-medium">Offer declined</span>
      </div>
    </div>
  );
});
