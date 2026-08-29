import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { OnboardingCard } from "./OnboardingCard";

interface OnboardingCardsViewProps {
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
  expandedRequest: string | null;
  onToggleExpand: (id: string) => void;
  getDocsForRequestAndStage: (reqId: string, stageKey: string) => OnboardingDoc[];
  getStageProgress: (reqId: string, stageKey: string) => number;
  isStageComplete: (reqId: string, stageKey: string) => boolean;
  isDocOverdue: (doc: OnboardingDoc) => boolean;
  onApprove: (req: OnboardingRequest) => void;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onRegressStage?: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
  onPopulateDefaultChecklist: (req: OnboardingRequest) => void;
  onDeleteRequest: (req: OnboardingRequest) => void;
  onOpenDocModal: (req: OnboardingRequest, stageKey: string) => void;
  onOpenEditDocModal: (req: OnboardingRequest, doc: OnboardingDoc) => void;
  onBulkSetDeadline: (req: OnboardingRequest, stageKey: string, days: number) => void;
  onRefresh: () => void;
  onStartOnboarding: () => void;
}

export const OnboardingCardsView = memo(function OnboardingCardsView({
  requests,
  documents,
  expandedRequest,
  onToggleExpand,
  getDocsForRequestAndStage,
  getStageProgress,
  isStageComplete,
  isDocOverdue,
  onApprove,
  onAdvanceStage,
  onRegressStage,
  onCompleteOnboarding,
  onPopulateDefaultChecklist,
  onDeleteRequest,
  onOpenDocModal,
  onOpenEditDocModal,
  onBulkSetDeadline,
  onRefresh,
  onStartOnboarding,
}: OnboardingCardsViewProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-user-follow-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Onboarding Journeys Found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No active employee onboarding journeys match the selected stage, status, or search query.
        </p>
        <button
          onClick={onStartOnboarding}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Start Onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <OnboardingCard
          key={req.id}
          request={req}
          documents={documents}
          isExpanded={expandedRequest === req.id}
          onToggleExpand={(id) => onToggleExpand(expandedRequest === id ? "" : id)}
          getDocsForRequestAndStage={getDocsForRequestAndStage}
          getStageProgress={getStageProgress}
          isStageComplete={isStageComplete}
          isDocOverdue={isDocOverdue}
          onApprove={onApprove}
          onAdvanceStage={onAdvanceStage}
          onRegressStage={onRegressStage}
          onCompleteOnboarding={onCompleteOnboarding}
          onPopulateDefaultChecklist={onPopulateDefaultChecklist}
          onDeleteRequest={onDeleteRequest}
          onOpenDocModal={onOpenDocModal}
          onOpenEditDocModal={onOpenEditDocModal}
          onBulkSetDeadline={onBulkSetDeadline}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
});
