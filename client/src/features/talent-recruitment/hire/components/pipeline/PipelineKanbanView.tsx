import { memo } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "../../types";
import { STAGE_CONFIG, PIPELINE_STAGES } from "../../constants";

interface PipelineKanbanViewProps {
  candidates: Candidate[];
  onUpdateStage: (id: string, stage: string) => void;
  onMoveToOnboarding: (c: Candidate) => void;
}

export const PipelineKanbanView = memo(function PipelineKanbanView({
  candidates,
  onUpdateStage,
  onMoveToOnboarding,
}: PipelineKanbanViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[520px] w-full scrollbar-thin">
      {PIPELINE_STAGES.map((stage) => {
        const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.cv_received;
        const colCandidates = candidates.filter((c) => {
          const norm = c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
          return norm === stage;
        });

        return (
          <div
            key={stage}
            className="w-72 min-w-[280px] shrink-0 bg-gray-50/80 rounded-2xl p-3 border border-gray-200/80 flex flex-col min-h-[480px] shadow-2xs"
          >
            {/* Stage Column Header */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider truncate" title={cfg.label}>
                  {cfg.label}
                </h4>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200 shadow-2xs">
                {colCandidates.length}
              </span>
            </div>

            {/* Candidate Mini Cards */}
            <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar pr-0.5">
              {colCandidates.map((c) => {
                const currentNormStage =
                  c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;

                return (
                  <div
                    key={c.id}
                    className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {c.candidate_code && (
                          <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                            {c.candidate_code}
                          </span>
                        )}
                        <Link
                          to={`/hire/candidates/${c.id}`}
                          className="text-xs font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate block flex-1"
                        >
                          {c.full_name}
                        </Link>
                      </div>

                      <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                        {c.job_postings?.title || "General Application"}
                      </p>

                      {c.rating ? (
                        <div className="flex items-center gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`text-[10px] ${
                                star <= c.rating! ? "ri-star-fill text-amber-400" : "ri-star-line text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                      <select
                        value={currentNormStage}
                        onChange={(e) => onUpdateStage(c.id, e.target.value)}
                        className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none cursor-pointer max-w-[170px] truncate"
                      >
                        {PIPELINE_STAGES.map((st) => (
                          <option key={st} value={st}>
                            → {STAGE_CONFIG[st]?.label || st}
                          </option>
                        ))}
                      </select>

                      {currentNormStage === "hired" && (
                        <button
                          onClick={() => onMoveToOnboarding(c)}
                          className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[9px] rounded-md hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                          title="Move to Onboarding"
                        >
                          Onboard
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {colCandidates.length === 0 && (
                <div className="h-28 flex items-center justify-center border-2 border-dashed border-gray-200/80 rounded-xl text-[10px] text-gray-400 font-bold">
                  No applicants
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
