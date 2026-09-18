import { memo } from "react";

export const PersonalHeaderBanner = memo(function PersonalHeaderBanner() {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
      <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
        <i className="ri-user-3-line text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-black text-slate-900 tracking-wide uppercase">
            Personal Info
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
            Step 1 of 5
          </span>
        </div>
        <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
          Configure authoritative identity credentials, title, naming conventions, residency, and tax classifications.
        </p>
      </div>
    </div>
  );
});
