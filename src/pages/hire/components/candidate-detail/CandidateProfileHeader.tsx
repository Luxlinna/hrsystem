import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";
import { initials } from "../../hireUtils";

interface CandidateProfileHeaderProps {
  candidate: Candidate;
  onUpdateStage: (stage: string) => void;
  onRate: (star: number) => void;
  onUploadResume: (file: File) => void;
  uploadingResume: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDelete: () => void;
}

export const CandidateProfileHeader = memo(function CandidateProfileHeader({
  candidate,
  onUpdateStage,
  onRate,
  onUploadResume,
  uploadingResume,
  fileInputRef,
  onDelete,
}: CandidateProfileHeaderProps) {
  const cfg = STAGE_CONFIG[candidate.stage] || STAGE_CONFIG.applied;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-xl font-black shadow-md shrink-0">
            {initials(candidate.full_name)}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">{candidate.full_name}</h1>
              <select
                value={candidate.stage}
                onChange={(e) => onUpdateStage(e.target.value)}
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border cursor-pointer focus:outline-none ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                {PIPELINE_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {STAGE_CONFIG[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Applying for{" "}
              <span className="font-bold text-gray-900">
                {candidate.job_postings?.title || "Direct Application"}
              </span>{" "}
              · {candidate.job_postings?.department || "General"}
            </p>
          </div>
        </div>

        {/* Header Right Actions & Rating */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Star Rating */}
          <div className="flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200/80">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRate(star)}
                className={`text-base cursor-pointer transition-colors ${
                  star <= (candidate.rating || 0)
                    ? "text-amber-400"
                    : "text-gray-200 hover:text-amber-300"
                }`}
              >
                <i className={star <= (candidate.rating || 0) ? "ri-star-fill" : "ri-star-line"} />
              </button>
            ))}
          </div>

          {/* Resume Action */}
          {candidate.resume_url ? (
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] text-xs font-bold rounded-xl transition-all"
            >
              <i className="ri-file-pdf-line text-sm" />
              View Resume
            </a>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <i className="ri-upload-2-line text-sm" />
              {uploadingResume ? "Uploading..." : "Attach Resume"}
            </button>
          )}

          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadResume(f);
            }}
          />

          <button
            onClick={onDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
            title="Delete Candidate"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
