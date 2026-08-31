import { memo } from "react";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials } from "../../hireUtils";

interface CandidateProfileHeaderProps {
  candidate: Candidate;
  onUpdateStage: (stage: string) => void;
  onOpenSchedule: () => void;
}

export const CandidateProfileHeader = memo(function CandidateProfileHeader({
  candidate,
  onUpdateStage,
  onOpenSchedule,
}: CandidateProfileHeaderProps) {
  const isHired = candidate.stage === "hired";
  const isRejected = candidate.stage === "rejected";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Dark Navy Square Avatar */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#172B4D] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shrink-0 shadow-md">
            {initials(candidate.full_name)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 capitalize tracking-tight">
                {candidate.full_name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isHired
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : isRejected
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-sky-100 text-sky-800 border border-sky-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {candidate.stage}
              </span>
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
              {candidate.job_postings?.title && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700">
                  <i className="ri-briefcase-line text-gray-500" /> {candidate.job_postings.title}
                </span>
              )}
              {candidate.job_postings?.department && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700">
                  <i className="ri-building-line text-gray-500" /> {candidate.job_postings.department}
                </span>
              )}
              {candidate.job_postings?.branches?.name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700">
                  <i className="ri-map-pin-line text-gray-500" /> {candidate.job_postings.branches.name}
                </span>
              )}
            </div>

            {/* Contact Meta Row */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 font-medium pt-1">
              {candidate.email && (
                <span className="flex items-center gap-1.5">
                  <i className="ri-mail-line text-gray-400" /> {candidate.email}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <i className="ri-phone-line text-gray-400" /> {candidate.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <i className="ri-calendar-line text-gray-400" /> Applied{" "}
                {new Date(candidate.applied_at || Date.now()).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Header Actions */}
        <div className="flex items-center gap-3 flex-wrap self-start lg:self-center">
          <button
            onClick={onOpenSchedule}
            className="px-4 py-2.5 bg-[#172B4D] hover:bg-[#0f1d35] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-calendar-event-line" />
            Schedule Interview
          </button>

          {/* Stage Dropdown */}
          <div className="relative">
            <select
              value={candidate.stage}
              onChange={(e) => onUpdateStage(e.target.value)}
              className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-2xs focus:outline-none focus:border-[#172B4D] cursor-pointer appearance-none pr-8"
            >
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  Stage: {STAGE_CONFIG[st]?.label || st}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
          </div>

          {isHired ? (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" /> Hired
            </span>
          ) : isRejected ? (
            <span className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5">
              <i className="ri-close-circle-fill text-rose-600 text-sm" /> Rejected
            </span>
          ) : (
            <button
              onClick={() => onUpdateStage("hired")}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="ri-check-line text-sm" /> Mark as Hired
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
