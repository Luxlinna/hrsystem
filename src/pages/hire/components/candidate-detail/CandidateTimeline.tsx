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
  const currentIndex = STAGE_TIMELINE_ORDER.indexOf(currentStage);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        Recruitment Progression
      </h3>

      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-gray-100 z-0" />

        {STAGE_TIMELINE_ORDER.map((stage, idx) => {
          const cfg = STAGE_CONFIG[stage];
          const isPassed = currentIndex >= idx && currentStage !== "rejected";
          const isCurrent = currentStage === stage;

          return (
            <button
              key={stage}
              type="button"
              onClick={() => onUpdateStage(stage)}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isCurrent
                    ? "bg-[#253C7D] text-white ring-4 ring-[#253C7D]/20 scale-110"
                    : isPassed
                    ? "bg-emerald-600 text-white"
                    : "bg-white border-2 border-gray-200 text-gray-400 group-hover:border-gray-400"
                }`}
              >
                {isPassed && !isCurrent ? <i className="ri-check-line" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-bold mt-2 capitalize ${
                  isCurrent ? "text-[#253C7D]" : isPassed ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {cfg?.label || stage}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
