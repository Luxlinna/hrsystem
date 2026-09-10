import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials, formatRelative } from "../../hireUtils";

interface PendingCvReviewListProps {
  candidates: Candidate[];
  onUpdateCandidateStage: (id: string, stage: string) => void;
}

export const PendingCvReviewList = memo(function PendingCvReviewList({
  candidates,
  onUpdateCandidateStage,
}: PendingCvReviewListProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <i className="ri-file-search-line" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Pending CV Review</h3>
            <p className="text-[11px] text-gray-400">
              Applicants in your responsibility scope awaiting stage advancement
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {candidates.length} Candidates
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <i className="ri-checkbox-circle-line text-3xl text-emerald-500 mb-1" />
          <p className="text-xs font-bold text-gray-700">All CV reviews caught up!</p>
          <p className="text-[11px] text-gray-400">No applicants currently pending review for this role.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c) => {
            const normStage =
              c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
            const stageCfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.cv_received;

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(c.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.candidate_code && (
                        <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {c.candidate_code}
                        </span>
                      )}
                      <Link
                        to={`/hire/candidates/${c.id}`}
                        className="font-extrabold text-sm text-gray-900 hover:text-[#253C7D] transition-colors truncate"
                      >
                        {c.full_name}
                      </Link>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${stageCfg.bg} ${stageCfg.text} ${stageCfg.border}`}
                      >
                        {stageCfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                      {c.job_postings?.title || "General Application"}{" "}
                      <span className="text-gray-400">({c.job_postings?.department || "General"})</span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                      <span>
                        <i className="ri-time-line mr-1 text-amber-500" />
                        Applied {formatRelative(c.applied_at)}
                      </span>
                      {c.location && (
                        <span>
                          <i className="ri-map-pin-line mr-1 text-gray-400" />
                          {c.location}
                        </span>
                      )}
                      {c.resume_url && (
                        <a
                          href={c.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#253C7D] hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <i className="ri-file-text-line" /> View Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <select
                    value={normStage}
                    onChange={(e) => onUpdateCandidateStage(c.id, e.target.value)}
                    className="text-xs font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none cursor-pointer"
                  >
                    {PIPELINE_STAGES.map((st) => (
                      <option key={st} value={st}>
                        Move to: {STAGE_CONFIG[st]?.label || st}
                      </option>
                    ))}
                  </select>

                  <Link
                    to={`/hire/candidates/${c.id}`}
                    className="px-3.5 py-2 bg-[#253C7D] hover:bg-[#1b2b5a] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors whitespace-nowrap"
                  >
                    Full Profile →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
