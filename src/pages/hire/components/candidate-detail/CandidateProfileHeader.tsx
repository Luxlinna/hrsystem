import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials, formatDateTime } from "../../hireUtils";

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
  const normStage =
    candidate.stage === "applied" ? "cv_received" : candidate.stage === "interview" ? "hr_interview" : candidate.stage;
  const cfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.cv_received;
  const isHired = normStage === "hired";
  const isRejected = normStage === "rejected";

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
              {candidate.candidate_code && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#253C7D] font-mono font-extrabold text-xs tracking-wider">
                  {candidate.candidate_code}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 capitalize tracking-tight">
                {candidate.full_name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.hex }} />
                {cfg.label}
              </span>
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
              {candidate.job_postings?.title && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700">
                  <i className="ri-briefcase-line text-gray-500" /> {candidate.job_postings.title}
                </span>
              )}
              {candidate.location && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50/70 border border-blue-100 font-bold text-blue-800">
                  <i className="ri-map-pin-line text-blue-500" /> {candidate.location}
                </span>
              )}
              {candidate.assigned_recruiter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-100 font-bold text-purple-700">
                  <i className="ri-user-star-line text-purple-500" /> Recruiter: {candidate.assigned_recruiter.first_name} {candidate.assigned_recruiter.last_name}
                </span>
              )}
              {candidate.tags && candidate.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px]">
                  #{t}
                </span>
              ))}
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
              {candidate.expected_salary && (
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <i className="ri-money-dollar-circle-line" /> ${candidate.expected_salary.toLocaleString()}/mo
                </span>
              )}
              {candidate.notice_period && (
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <i className="ri-time-line" /> {candidate.notice_period}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <i className="ri-calendar-line text-gray-400" /> Applied {formatDateTime(candidate.applied_at)}
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
              value={normStage}
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
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" /> Hired
              </span>
              <Link
                to="/onboarding"
                className="px-3.5 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1b2b5a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <i className="ri-compass-3-line text-sm" /> View in Onboarding
              </Link>
            </div>
          ) : isRejected ? (
            <span className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5">
              <i className="ri-close-circle-fill text-rose-600 text-sm" /> Rejected
            </span>
          ) : (
            <button
              onClick={() => onUpdateStage("hired")}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <i className="ri-user-received-2-line text-sm" /> Move to Onboarding
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
