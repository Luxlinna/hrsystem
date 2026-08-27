import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials, formatRelative } from "../../hireUtils";

interface CandidateCardProps {
  candidate: Candidate;
  onUpdateStage: (id: string, stage: string) => void;
  onRate: (id: string, rating: number) => void;
  onMoveToOnboarding: (c: Candidate) => void;
  onUploadResume: (id: string, file: File) => void;
  onEdit: (c: Candidate) => void;
  onDelete: (id: string, name: string) => void;
}

export const CandidateCard = memo(function CandidateCard({
  candidate,
  onUpdateStage,
  onRate,
  onMoveToOnboarding,
  onUploadResume,
  onEdit,
  onDelete,
}: CandidateCardProps) {
  const cfg = STAGE_CONFIG[candidate.stage] || STAGE_CONFIG.applied;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link to={`/hire/candidates/${candidate.id}`} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
              {initials(candidate.full_name)}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-[#253C7D] transition-colors truncate">
                {candidate.full_name}
              </h4>
              <p className="text-[10px] text-gray-400 truncate font-semibold">
                Applied {formatRelative(candidate.applied_at)}
              </p>
            </div>
          </Link>

          {/* Quick Stage Dropdown */}
          <select
            value={candidate.stage}
            onChange={(e) => onUpdateStage(candidate.id, e.target.value)}
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border cursor-pointer focus:outline-none ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {PIPELINE_STAGES.map((st) => (
              <option key={st} value={st}>
                {STAGE_CONFIG[st]?.label || st}
              </option>
            ))}
          </select>
        </div>

        {/* Vacancy Info */}
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs mb-3 space-y-1">
          <p className="font-bold text-gray-900 truncate">
            {candidate.job_postings?.title || "Direct Application"}
          </p>
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{candidate.job_postings?.department || "General"}</span>
            <span className="font-medium">{candidate.source}</span>
          </div>
        </div>

        {/* Star Rating & Resume Link */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRate(candidate.id, star)}
                className={`text-sm cursor-pointer transition-colors ${
                  star <= (candidate.rating || 0)
                    ? "text-amber-400"
                    : "text-gray-200 hover:text-amber-300"
                }`}
              >
                <i className={star <= (candidate.rating || 0) ? "ri-star-fill" : "ri-star-line"} />
              </button>
            ))}
          </div>

          {candidate.resume_url ? (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1"
            >
              <i className="ri-file-text-line" />
              Resume
            </a>
          ) : (
            <label className="text-[11px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1">
              <i className="ri-upload-2-line" />
              + Resume
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadResume(candidate.id, f);
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Card Bottom Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
        <Link
          to={`/hire/candidates/${candidate.id}`}
          className="text-xs font-bold text-gray-600 hover:text-[#253C7D] transition-colors"
        >
          View Profile →
        </Link>

        <div className="flex items-center gap-1">
          {candidate.stage === "hired" && (
            <button
              onClick={() => onMoveToOnboarding(candidate)}
              className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Transfer to Onboarding module"
            >
              <i className="ri-user-shared-line text-xs" />
              Onboarding
            </button>
          )}

          <button
            onClick={() => onEdit(candidate)}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Edit"
          >
            <i className="ri-edit-line text-sm" />
          </button>

          <button
            onClick={() => onDelete(candidate.id, candidate.full_name)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
