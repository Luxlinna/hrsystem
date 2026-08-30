import { memo } from "react";
import type { OnboardingHire } from "../types";

interface StageCount {
  done: number;
  total: number;
}

interface CandidateProgressionStagesProps {
  selectedHire: OnboardingHire;
  stageStats: {
    documents: StageCount;
    it_setup: StageCount;
    training: StageCount;
    general: StageCount;
  };
}

export const CandidateProgressionStages = memo(function CandidateProgressionStages({
  selectedHire,
  stageStats,
}: CandidateProgressionStagesProps) {
  const stageItems = [
    { label: "Document Collection", key: "document", count: stageStats.documents, step: 1 },
    { label: "IT & Equipment Setup", key: "it_setup", count: stageStats.it_setup, step: 2 },
    { label: "Training & Orientation", key: "training", count: stageStats.training, step: 3 },
    { label: "Final Sign-off", key: "complete", count: stageStats.general, step: 4 },
  ];

  return (
    <div>
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        4-Stage Onboarding Progression
      </h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stageItems.map((item, idx) => {
          const hireStageIdx = ["document", "it_setup", "training", "complete"].indexOf(selectedHire.stage);
          const isActive = selectedHire.stage === item.key;
          const isCompleted = hireStageIdx > idx;

          return (
            <div
              key={item.key}
              className={`px-4 py-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                isActive
                  ? "bg-[#253C7D]/5 border-[#253C7D] text-[#253C7D]"
                  : isCompleted
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-700"
                  : "bg-gray-50/50 border-gray-200 text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCompleted ? (
                  <i className="ri-checkbox-circle-fill text-emerald-500 text-sm shrink-0" />
                ) : isActive ? (
                  <i className="ri-focus-2-line text-[#253C7D] text-sm shrink-0 animate-pulse" />
                ) : (
                  <i className="ri-lock-line text-gray-400 text-sm shrink-0" />
                )}
                <span className="text-[12px] font-bold truncate">{item.label}</span>
              </div>
              <span className="text-[11px] font-black shrink-0">
                {item.count.done}/{item.count.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
