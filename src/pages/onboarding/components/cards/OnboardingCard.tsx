import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES } from "../../constants";
import { OnboardingStageAccordion } from "./OnboardingStageAccordion";
import { initials, getOverallProgress } from "../../onboardingUtils";

interface OnboardingCardProps {
  request: OnboardingRequest;
  documents: OnboardingDoc[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  getDocsForRequestAndStage: (reqId: string, stageKey: string) => OnboardingDoc[];
  getStageProgress: (reqId: string, stageKey: string) => number;
  isStageComplete: (reqId: string, stageKey: string) => boolean;
  isDocOverdue: (doc: OnboardingDoc) => boolean;
  onApprove: (req: OnboardingRequest) => void;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
  onPopulateDefaultChecklist: (req: OnboardingRequest) => void;
  onDeleteRequest: (req: OnboardingRequest) => void;
  onOpenDocModal: (req: OnboardingRequest, stageKey: string) => void;
  onOpenEditDocModal: (req: OnboardingRequest, doc: OnboardingDoc) => void;
  onBulkSetDeadline: (req: OnboardingRequest, stageKey: string, days: number) => void;
  onRefresh: () => void;
}

export const OnboardingCard = memo(function OnboardingCard({
  request,
  documents,
  isExpanded,
  onToggleExpand,
  getDocsForRequestAndStage,
  getStageProgress,
  isStageComplete,
  isDocOverdue,
  onApprove,
  onAdvanceStage,
  onCompleteOnboarding,
  onPopulateDefaultChecklist,
  onDeleteRequest,
  onOpenDocModal,
  onOpenEditDocModal,
  onBulkSetDeadline,
  onRefresh,
}: OnboardingCardProps) {
  const emp = request.employees;
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
  const overallProgress = getOverallProgress(request, documents);
  const currentStageIdx = STAGES.findIndex((s) => s.key === request.stage);

  return (
    <div
      id={`onboarding-request-${request.id}`}
      tabIndex={-1}
      className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all outline-none focus:ring-2 focus:ring-[#253C7D]"
    >
      {/* Header Row: Employee Meta & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] font-extrabold text-sm flex items-center justify-center shrink-0">
            {initials(emp?.first_name, emp?.last_name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-base text-gray-900 truncate">{fullName}</h3>
            <p className="text-xs text-gray-400 font-medium truncate">
              {emp?.role || "Staff"} &middot; {emp?.department || "General"} &middot; {emp?.branches?.name || "HQ"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <div className="text-right">
            <span className="text-sm font-black text-gray-900">{overallProgress}%</span>
            <p className="text-[10px] text-gray-400 font-semibold">Total Completion</p>
          </div>
          <button
            onClick={() => onToggleExpand(request.id)}
            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors cursor-pointer"
            title="Expand / Collapse"
          >
            <i className={`ri-arrow-down-s-line text-lg transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            request.status === "completed" ? "bg-emerald-500" : "bg-[#253C7D]"
          }`}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Pending Approval Alert Banner */}
      {request.status === "pending" && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <i className="ri-time-line text-base text-amber-600 shrink-0" />
            <span>This onboarding request is awaiting formal approval to begin Step 1.</span>
          </div>
          <button
            onClick={() => onApprove(request)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            Approve & Unlock
          </button>
        </div>
      )}

      {/* 4-Stage Accordion List */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          {STAGES.map((stage, idx) => {
            const stageDocs = getDocsForRequestAndStage(request.id, stage.key);
            const stageProgress = getStageProgress(request.id, stage.key);
            const isComplete = isStageComplete(request.id, stage.key);

            return (
              <OnboardingStageAccordion
                key={stage.key}
                stage={stage}
                stageIdx={idx}
                currentStageIdx={currentStageIdx}
                request={request}
                stageDocs={stageDocs}
                stageProgress={stageProgress}
                isComplete={isComplete}
                onOpenDocModal={onOpenDocModal}
                onOpenEditDocModal={onOpenEditDocModal}
                onAdvanceStage={onAdvanceStage}
                onCompleteOnboarding={onCompleteOnboarding}
                onBulkSetDeadline={onBulkSetDeadline}
                onRefresh={onRefresh}
                isDocOverdue={isDocOverdue}
              />
            );
          })}

          {/* Footer Card Controls */}
          <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
            <button
              onClick={() => onPopulateDefaultChecklist(request)}
              className="font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-magic-line" />
              Reset / Reload Standard Checklist
            </button>
            <button
              onClick={() => onDeleteRequest(request)}
              className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-delete-bin-line" />
              Delete Journey
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
