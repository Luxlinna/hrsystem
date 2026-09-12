import { memo } from "react";
import type { Candidate, Interview } from "../../types";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../../constants";
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

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
          PIPELINE TIMELINE
        </span>
        <span className="text-[10px] text-gray-400 font-medium">Sequential progression</span>
      </div>
      <div className="space-y-0 relative pl-2">
        {STAGE_TIMELINE_ORDER.map((stage, idx) => {
          const isCurrent = normStage === stage;
          const isPassed = currentIndex > idx && normStage !== "rejected";
          const isNext = idx === currentIndex + 1;
          const isLocked = idx > currentIndex + 1;
          const isLast = idx === STAGE_TIMELINE_ORDER.length - 1;

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
                onClick={() => {
                  onUpdateStage(stage);
                  if (stage === "candidate_approval" && onOpenCandidateApproval) {
                    onOpenCandidateApproval();
                  } else if (stage === "salary_negotiation" && onOpenSalaryProposal) {
                    onOpenSalaryProposal();
                  }
                }}
                className={`flex items-center gap-3 text-left relative z-10 transition-opacity ${
                  isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:opacity-90"
                }`}
                title={isLocked ? "Complete previous stages first" : undefined}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                    isCurrent
                      ? "bg-[#172B4D] border-[#172B4D] ring-4 ring-[#172B4D]/20"
                      : isPassed
                      ? "bg-[#172B4D] border-[#172B4D]"
                      : isNext
                      ? "bg-white border-[#172B4D] ring-2 ring-[#172B4D]/10"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {isPassed && <i className="ri-check-line text-[10px] text-white leading-none font-bold" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs capitalize font-bold ${
                      isCurrent
                        ? "text-[#172B4D] font-extrabold"
                        : isPassed
                        ? "text-gray-900"
                        : isNext
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {STAGE_CONFIG[stage]?.label || stage}
                  </span>
                  {requiresForm && (
                    <span
                      className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                        isFormVerified
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isCurrent
                          ? "bg-purple-100 text-purple-800 border border-purple-200 animate-pulse"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                      title={
                        isApprovalStage
                          ? isFormVerified
                            ? "Candidate Approval Form signed & verified"
                            : "Candidate Approval Form (CAF) required"
                          : isFormVerified
                          ? "Interview scheduled & evaluation verified"
                          : "Evaluation form required"
                      }
                    >
                      {isFormVerified ? "Form Verified" : "Form Required"}
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
