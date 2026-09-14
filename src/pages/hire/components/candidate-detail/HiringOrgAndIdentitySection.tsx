import { memo } from "react";
import type { Candidate } from "../../types";

interface HiringOrgAndIdentitySectionProps {
  candidate: Candidate;
  copiedField: string | null;
  onCopy: (text: string | null | undefined, label: string) => void;
}

export const HiringOrgAndIdentitySection = memo(function HiringOrgAndIdentitySection({
  candidate,
  copiedField,
  onCopy,
}: HiringOrgAndIdentitySectionProps) {
  return (
    <>
      {/* Section 1: Personal & Legal Identification */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <i className="ri-user-smile-line text-blue-600 text-sm" />
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            1. Personal &amp; Legal Identification
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Candidate ID */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              ID (Candidate Code)
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono font-bold text-blue-700">
                {candidate.candidate_code || candidate.id}
              </span>
              <button
                type="button"
                onClick={() => onCopy(candidate.candidate_code || candidate.id, "Candidate ID")}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                title="Copy ID"
              >
                <i className={copiedField === "Candidate ID" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Full Name (English)
            </span>
            <p className="text-xs font-black text-slate-800 mt-1">
              {candidate.full_name}
            </p>
          </div>

          {/* Khmer Name */}
          <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/70">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
              KH Name (Khmer Script)
            </span>
            <p className="text-xs font-black text-blue-950 mt-1 font-khmer">
              {candidate.kh_name || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
            </p>
          </div>

          {/* Gender */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Gender
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.gender || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Date of Birth */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Date of Birth
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.date_of_birth || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Marital Status */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Marital Status
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.marital_status || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* National ID Number */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative sm:col-span-2 lg:col-span-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              National ID Number (Khmer ID / Passport)
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono font-bold text-slate-800">
                {candidate.national_id_number || (
                  <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>
                )}
              </span>
              {candidate.national_id_number && (
                <button
                  type="button"
                  onClick={() => onCopy(candidate.national_id_number, "National ID")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy National ID"
                >
                  <i className={copiedField === "National ID" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Organizational Placement & Physical Site */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <i className="ri-building-line text-indigo-600 text-sm" />
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            2. Organizational Structure &amp; Physical Site Workplace
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Code BU */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Code BU
            </span>
            <p className="text-xs font-mono font-bold text-slate-800 mt-1">
              {candidate.code_bu || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
            </p>
          </div>

          {/* BU Full Name */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              BU Full Name
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.bu_full_name || candidate.business_unit || (
                <span className="text-slate-400 font-normal italic">Not recorded</span>
              )}
            </p>
          </div>

          {/* Handle BU */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Handle BU
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.handle_bu || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Division */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Division
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.division || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Department */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Department
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.department || candidate.job_postings?.department || (
                <span className="text-slate-400 font-normal italic">Not recorded</span>
              )}
            </p>
          </div>

          {/* Position */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Position
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.position || candidate.job_title || candidate.job_postings?.title || (
                <span className="text-slate-400 font-normal italic">Not recorded</span>
              )}
            </p>
          </div>

          {/* Site (Physical Workplace Station) */}
          <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-building-4-line text-indigo-600" />
                <span>Site (Physical Workplace)</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.2 rounded-md">
                Stationed Workplace
              </span>
            </div>
            <p className="text-xs font-extrabold text-indigo-950 mt-1">
              {candidate.site || <span className="text-slate-400 font-normal italic font-sans">No physical site assigned</span>}
            </p>
            <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5">
              Specific branch, office building, or project location where employee is stationed.
            </p>
          </div>

          {/* Working Location */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2 lg:col-span-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Working Location (City / Region)
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.working_location || candidate.location || (
                <span className="text-slate-400 font-normal italic">Not recorded</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
});
