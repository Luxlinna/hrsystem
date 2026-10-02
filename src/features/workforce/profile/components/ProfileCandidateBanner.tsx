import React, { useState } from "react";
import type { MyEmployee } from "../types";
import { toast } from "@/components/Toast";

interface ProfileCandidateBannerProps {
  employee: MyEmployee | null;
  candidateId: string;
  savingProfessional: boolean;
  onSaveProfessional: () => void;
}

function getSourceIcon(source?: string | null) {
  if (!source) return "ri-user-shared-line";
  const s = source.toLowerCase();
  if (s.includes("telegram")) return "ri-telegram-fill text-sky-500";
  if (s.includes("linkedin")) return "ri-linkedin-box-fill text-blue-600";
  if (s.includes("walk")) return "ri-walk-line text-emerald-600";
  if (s.includes("referral")) return "ri-team-line text-amber-600";
  return "ri-global-line text-indigo-500";
}

export function ProfileCandidateBanner({
  employee,
  candidateId,
  savingProfessional,
  onSaveProfessional,
}: ProfileCandidateBannerProps) {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (!candidateId) return;
    navigator.clipboard.writeText(candidateId);
    setCopiedId(true);
    toast("Copied!", `Candidate ID ${candidateId} copied to clipboard`, "info");
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#162343] to-[#253C7D] p-6 sm:p-7 text-white shadow-md border border-slate-700/40">
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
            <i className="ri-shield-user-fill text-2xl text-blue-300"></i>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Candidate Master Profile
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Retrieved from Onboarding
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider text-white">
                {candidateId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[11px] font-semibold text-blue-100 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Copy Candidate ID"
              >
                <i className={copiedId ? "ri-check-line text-emerald-300" : "ri-file-copy-line"}></i>
                <span>{copiedId ? "Copied" : "Copy ID"}</span>
              </button>
            </div>

            <p className="text-[12px] text-blue-100/80 mt-1">
              Transferred automatically from your candidate recruitment & new hire onboarding process.
            </p>
          </div>
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onSaveProfessional}
            disabled={savingProfessional}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#253C7D] hover:bg-blue-50 font-bold text-[13px] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {savingProfessional ? (
              <>
                <i className="ri-loader-4-line animate-spin text-[15px]"></i>
                Saving Changes...
              </>
            ) : (
              <>
                <i className="ri-save-3-line text-[15px]"></i>
                Save Profile Info
              </>
            )}
          </button>
        </div>
      </div>

      {(employee?.source || employee?.assigned_recruiter_name || (employee?.tags && employee.tags.length > 0)) && (
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[12px]">
          {employee?.source && (
            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
              <i className={`${getSourceIcon(employee.source)} text-[14px]`}></i>
              <span className="text-white/60">Source:</span>
              <span className="font-semibold text-white">{employee.source}</span>
            </div>
          )}
          {employee?.assigned_recruiter_name && (
            <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
              <i className="ri-user-voice-line text-blue-300 text-[14px]"></i>
              <span className="text-white/60">Recruiter:</span>
              <span className="font-semibold text-white">{employee.assigned_recruiter_name}</span>
            </div>
          )}
          {employee?.tags && employee.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <i className="ri-price-tag-3-line text-indigo-300 text-[13px]"></i>
              <div className="flex flex-wrap gap-1.5">
                {employee.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="bg-white/15 text-white text-[11px] px-2.5 py-0.5 rounded-full font-medium border border-white/10"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
