import { memo, useState } from "react";
import type { Candidate, Interview } from "../../types";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../../constants";
import { RECRUITMENT_PHASES, getPhaseForStage } from "../../constants/processPhasesConfig";
import {
  isStageInterviewScheduled,
  isStageInterviewEvaluated,
  isCandidateApprovalVerified,
} from "../../constants/evidenceConfig";

interface CandidatePipelineWidgetProps {
  currentStage: string;
  candidate?: Candidate | null;
  interviews?: Interview[];
  onUpdateStage: (stage: string) => void;
  onOpenCandidateApproval?: () => void;
  onOpenSalaryProposal?: () => void;
}

export const CandidatePipelineWidget = memo(function CandidatePipelineWidget({
  currentStage,
  candidate,
  interviews = [],
  onUpdateStage,
  onOpenCandidateApproval,
  onOpenSalaryProposal,
}: CandidatePipelineWidgetProps) {
  const normStage =
    currentStage === "applied" ? "cv_received" : currentStage === "interview" ? "hr_interview" : currentStage;
  const currentIndex = STAGE_TIMELINE_ORDER.indexOf(normStage);
  const activePhase = getPhaseForStage(normStage);

  // Default expanded phases: active phase is open, others can be toggled
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(() => ({
    [activePhase?.id || "sourcing"]: true,
  }));

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
            RECRUITMENT PIPELINE
          </span>
          <span className="text-xs font-bold text-gray-800">Sequential Stages (14)</span>
        </div>
        <span className="text-[11px] font-bold text-[#253C7D] px-2 py-0.5 rounded-md bg-blue-50">
          Stage {currentIndex >= 0 ? currentIndex + 1 : 1}/14
        </span>
      </div>

      {/* Grouped by the 4 Clear Phases */}
      <div className="space-y-2.5">
        {RECRUITMENT_PHASES.map((phase, pIdx) => {
          const isPhaseOpen = !!expandedPhases[phase.id];
          const phaseIndices = phase.stages.map((s) => STAGE_TIMELINE_ORDER.indexOf(s));
          const minIdx = Math.min(...phaseIndices);
          const maxIdx = Math.max(...phaseIndices);
          const isPhaseCompleted = currentIndex > maxIdx && normStage !== "rejected";
          const isPhaseCurrent = currentIndex >= minIdx && currentIndex <= maxIdx;

          return (
            <div
              key={phase.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isPhaseCurrent
                  ? "border-[#253C7D]/30 bg-blue-50/20"
                  : isPhaseCompleted
                  ? "border-emerald-200/70 bg-emerald-50/10"
                  : "border-gray-200/70 bg-gray-50/30"
              }`}
            >
              {/* Phase Header Accordion Trigger */}
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isPhaseCompleted
                        ? "bg-emerald-600 text-white"
                        : isPhaseCurrent
                        ? "bg-[#253C7D] text-white ring-2 ring-[#253C7D]/20"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isPhaseCompleted ? <i className="ri-check-line" /> : pIdx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-black text-gray-800 leading-none">{phase.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{phase.subtitle}</p>
                  </div>
                </div>

                <i
                  className={`ri-arrow-down-s-line text-sm text-gray-400 transition-transform ${
                    isPhaseOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Sub-stages inside this phase */}
              {isPhaseOpen && (
                <div className="px-3 pb-3 pt-1 space-y-1 border-t border-gray-100/80">
                  {phase.stages.map((stage) => {
                    const idx = STAGE_TIMELINE_ORDER.indexOf(stage);
                    const isCurrent = normStage === stage;
                    const isPassed = currentIndex > idx && normStage !== "rejected";
                    const isNext = idx === currentIndex + 1;
                    const isLocked = idx > currentIndex + 1;

                    const isInterviewStage = ["hr_interview", "hiring_manager_interview", "final_interview"].includes(stage);
                    const isApprovalStage = stage === "candidate_approval";
                    const isFormVerified =
                      isInterviewStage && candidate
                        ? isStageInterviewScheduled(stage, interviews) && isStageInterviewEvaluated(stage, candidate, interviews)
                        : isApprovalStage && candidate
                        ? isCandidateApprovalVerified(candidate)
                        : false;
                    const requiresForm = isInterviewStage || isApprovalStage;

                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          onUpdateStage(stage);
                          if (stage === "candidate_approval" && onOpenCandidateApproval) {
                            onOpenCandidateApproval();
                          } else if (stage === "salary_negotiation" && onOpenSalaryProposal) {
                            onOpenSalaryProposal();
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isCurrent
                            ? "bg-white border border-[#253C7D]/40 shadow-xs ring-1 ring-[#253C7D]/20"
                            : isPassed
                            ? "hover:bg-white/80 text-gray-700"
                            : isNext
                            ? "hover:bg-white/80 text-gray-700 font-medium"
                            : "opacity-50 hover:opacity-80 text-gray-400 cursor-not-allowed"
                        }`}
                        title={isLocked ? "Complete previous stages first" : undefined}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                              isCurrent
                                ? "bg-[#253C7D] text-white"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "border border-gray-300 bg-white"
                            }`}
                          >
                            {isPassed ? <i className="ri-check-line" /> : idx + 1}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              isCurrent ? "font-black text-[#253C7D]" : isPassed ? "font-bold text-gray-800" : "font-medium"
                            }`}
                          >
                            {STAGE_CONFIG[stage]?.label || stage}
                          </span>
                        </div>

                        {requiresForm && (
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              isFormVerified
                                ? "bg-emerald-100 text-emerald-800"
                                : isCurrent
                                ? "bg-purple-100 text-purple-800 animate-pulse"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isFormVerified ? "Verified" : "Required"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
