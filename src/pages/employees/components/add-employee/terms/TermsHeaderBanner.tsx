import { memo } from "react";

export const TermsHeaderBanner = memo(function TermsHeaderBanner() {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border border-amber-200/80 flex items-start gap-3.5 shadow-2xs">
      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
        <i className="ri-calendar-check-line text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-900 tracking-wide uppercase">
            Schedule &amp; Contract Terms
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60">
            Step 3 of 5
          </span>
        </div>
        <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
          Configure working schedule, employment category, official start date, reporting line manager, contract terms, rates, and status.
        </p>
      </div>
    </div>
  );
});
