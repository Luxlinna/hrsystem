import { memo, useState } from "react";
import type { Candidate } from "../../types";
import { toast } from "@/components/Toast";

interface CandidateMasterSummaryProps {
  candidate: Candidate;
}

export const CandidateMasterSummary = memo(function CandidateMasterSummary({
  candidate,
}: CandidateMasterSummaryProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string | null | undefined, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast("Copied", `${text} copied to clipboard`, "info");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#253C7D]" />
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Master Profile Summary
          </h3>
        </div>
        {candidate.candidate_code && (
          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-200/70">
            {candidate.candidate_code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Email */}
        <div className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-mail-line text-slate-400" />
              <span>Email Address</span>
            </span>
            {candidate.email && (
              <button
                type="button"
                onClick={() => handleCopy(candidate.email, "email")}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
                title="Copy email"
              >
                <i className={copiedKey === "email" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
              </button>
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 mt-1 select-all truncate">
            {candidate.email || <span className="text-slate-400 font-normal italic">Not provided</span>}
          </p>
        </div>

        {/* Phone */}
        <div className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-phone-line text-slate-400" />
              <span>Phone Number</span>
            </span>
            {candidate.phone && (
              <button
                type="button"
                onClick={() => handleCopy(candidate.phone, "phone")}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
                title="Copy phone"
              >
                <i className={copiedKey === "phone" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
              </button>
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 mt-1 select-all">
            {candidate.phone || <span className="text-slate-400 font-normal italic">Not provided</span>}
          </p>
        </div>

        {/* Location */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-map-pin-2-line text-slate-400" />
            <span>Current Location</span>
          </span>
          <p className="text-xs font-bold text-slate-800 mt-1">
            {candidate.location || <span className="text-slate-400 font-normal italic">Not specified</span>}
          </p>
        </div>

        {/* Expected Salary */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-money-dollar-circle-line text-emerald-500" />
            <span>Target Compensation</span>
          </span>
          <p className="text-xs font-black text-emerald-600 mt-1">
            {candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} / month` : "Negotiable"}
          </p>
        </div>

        {/* Notice Period */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-time-line text-slate-400" />
            <span>Availability / Notice</span>
          </span>
          <p className="text-xs font-bold text-slate-800 mt-1">
            {candidate.notice_period || "Standard (1 Month)"}
          </p>
        </div>

        {/* Sourcing Channel */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-share-forward-line text-slate-400" />
            <span>Sourcing Channel</span>
          </span>
          <p className="text-xs font-bold text-slate-800 mt-1">
            {candidate.source || "Direct Application"}
          </p>
        </div>
      </div>
    </div>
  );
});
