import { memo } from "react";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../../constants";

interface CandidatePipelineWidgetProps {
  currentStage: string;
  onUpdateStage: (stage: string) => void;
}

export const CandidatePipelineWidget = memo(function CandidatePipelineWidget({
  currentStage,
  onUpdateStage,
}: CandidatePipelineWidgetProps) {
  const normStage =
    currentStage === "applied" ? "cv_received" : currentStage === "interview" ? "hr_interview" : currentStage;
  const currentIndex = STAGE_TIMELINE_ORDER.indexOf(normStage);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
          PIPELINE TIMELINE
        </span>
        <span className="text-[10px] text-gray-400 font-medium">Click step to jump</span>
      </div>
      <div className="space-y-0 relative pl-2">
        {STAGE_TIMELINE_ORDER.map((stage, idx) => {
          const isCurrent = normStage === stage;
          const isPassed = currentIndex >= idx && normStage !== "rejected";
          const isLast = idx === STAGE_TIMELINE_ORDER.length - 1;

          return (
            <div key={stage} className="relative flex items-start gap-3 pb-5 last:pb-0 group">
              {!isLast && (
                <div
                  className={`absolute left-[7px] top-3.5 bottom-0 w-0.5 ${
                    isPassed ? "bg-[#172B4D]" : "bg-gray-200"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => onUpdateStage(stage)}
                className="flex items-center gap-3 cursor-pointer text-left relative z-10"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isCurrent
                      ? "bg-[#172B4D] border-[#172B4D] ring-4 ring-[#172B4D]/20"
                      : isPassed
                      ? "bg-[#172B4D] border-[#172B4D]"
                      : "bg-white border-gray-300 group-hover:border-gray-400"
                  }`}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs capitalize font-bold ${
                      isCurrent
                        ? "text-[#172B4D] font-extrabold"
                        : isPassed
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {STAGE_CONFIG[stage]?.label || stage}
                  </span>
                  {["hr_interview", "hiring_manager_interview", "final_interview"].includes(stage) && (
                    <span
                      className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                        isCurrent
                          ? "bg-purple-100 text-purple-800 border border-purple-200 animate-pulse"
                          : isPassed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                      title="Evaluation form required evidence for this stage"
                    >
                      {isPassed ? "Form Verified" : "Form Required"}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
