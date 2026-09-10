import { memo } from "react";
import { STAGE_TIMELINE_ORDER, STAGE_CONFIG } from "../../constants";

interface CandidateTimelineProps {
  currentStage: string;
  onUpdateStage: (stage: string) => void;
}

export const CandidateTimeline = memo(function CandidateTimeline({
  currentStage,
  onUpdateStage,
}: CandidateTimelineProps) {
  const normStage =
    currentStage === "applied" ? "cv_received" : currentStage === "interview" ? "hr_interview" : currentStage;
  const currentIndex = STAGE_TIMELINE_ORDER.indexOf(normStage);
  const currentCfg = STAGE_CONFIG[normStage] || STAGE_CONFIG.cv_received;

  // Percentage for progress fill line
  const progressPercent =
    normStage === "rejected"
      ? 0
      : currentIndex >= 0
      ? (currentIndex / (STAGE_TIMELINE_ORDER.length - 1)) * 100
      : 0;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <i className="ri-git-commit-line text-[#253C7D] text-base" />
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
            Recruitment Funnel Progression
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {["hr_interview", "hiring_manager_interview", "final_interview"].includes(normStage) && (
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shadow-2xs">
              <i className="ri-file-list-3-line" />
              Evaluation Form Required
            </span>
          )}
          {normStage === "rejected" ? (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Candidate Rejected
            </span>
          ) : (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
              Stage {currentIndex >= 0 ? currentIndex + 1 : 1} of {STAGE_TIMELINE_ORDER.length}:{" "}
              <strong className="font-extrabold">{currentCfg.label}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin">
        <div className="flex items-center justify-between relative min-w-[1050px] px-6 py-2">
          {/* Base Background Connecting Line */}
          <div className="absolute top-[26px] left-10 right-10 h-1 bg-gray-100 z-0 rounded-full" />

          {/* Active Filled Connecting Line */}
          <div
            className="absolute top-[26px] left-10 h-1 bg-gradient-to-r from-[#253C7D] to-emerald-500 z-0 rounded-full transition-all duration-300"
            style={{ width: `calc(${progressPercent}% * 0.92)` }}
          />

          {STAGE_TIMELINE_ORDER.map((stage, idx) => {
            const cfg = STAGE_CONFIG[stage] || { label: stage, hex: "#64748B" };
            const isPassed = currentIndex >= idx && normStage !== "rejected";
            const isCurrent = normStage === stage;

            return (
              <button
                key={stage}
                type="button"
                onClick={() => onUpdateStage(stage)}
                className="relative z-10 flex flex-col items-center group cursor-pointer max-w-[85px] text-center"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isCurrent
                      ? "bg-[#253C7D] text-white ring-4 ring-[#253C7D]/20 scale-110"
                      : isPassed
                      ? "bg-emerald-600 text-white"
                      : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-400"
                  }`}
                >
                  {isPassed && !isCurrent ? (
                    <i className="ri-check-line text-sm" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold mt-2 leading-tight transition-colors line-clamp-2 ${
                    isCurrent ? "text-[#253C7D] font-extrabold" : isPassed ? "text-gray-800" : "text-gray-400"
                  }`}
                  title={cfg.label}
                >
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
