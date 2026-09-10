import { memo, useMemo, useState } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES } from "../../constants";
import { getOverallProgress } from "../../onboardingUtils";
import { OnboardingStageColumn } from "./OnboardingStageColumn";
import { OnboardingCardHeader } from "./OnboardingCardHeader";
import { SetupRequirementsModal } from "@/components/modals/SetupRequirementsModal";

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
  onRegressStage?: (req: OnboardingRequest) => void;
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
  onRegressStage,
  onCompleteOnboarding,
  onDeleteRequest,
  onOpenDocModal,
  onOpenEditDocModal,
  onBulkSetDeadline,
  onRefresh,
}: OnboardingCardProps) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const emp = request.employees;
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
  const overallProgress = getOverallProgress(request, documents);
  const currentStageIdx = STAGES.findIndex((s) => s.key === request.stage);

  const stageList = useMemo(() => {
    return STAGES.map((stage, idx) => {
      const stageDocs = getDocsForRequestAndStage(request.id, stage.key);
      const stageProgress = getStageProgress(request.id, stage.key);
      const isComplete = isStageComplete(request.id, stage.key);
      return { stage, idx, stageDocs, stageProgress, isComplete };
    });
  }, [request.id, getDocsForRequestAndStage, getStageProgress, isStageComplete]);

  const totalVerified = useMemo(() => {
    const totalDocs = documents.filter((d) => d.onboarding_request_id === request.id);
    const verified = totalDocs.filter((d) => d.status === "complete").length;
    return { verified, total: totalDocs.length };
  }, [request.id, documents]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4">
      {/* Profile & Main Controls */}
      <OnboardingCardHeader
        request={request}
        fullName={fullName}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onDeleteRequest={onDeleteRequest}
        onOpenSetupModal={() => setShowSetupModal(true)}
      />

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
          <span>Overall Progress ({totalVerified.verified} of {totalVerified.total} items verified)</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      {/* Pending Approval Banner */}
      {request.status === "pending" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-[11px]">
          <span className="text-amber-900 font-bold flex items-center gap-1.5">
            <i className="ri-time-line text-sm text-amber-600" />
            This onboarding request is awaiting formal approval to begin Step 1.
          </span>
          <button
            type="button"
            onClick={() => onApprove(request)}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl shadow-2xs cursor-pointer"
          >
            Approve Journey
          </button>
        </div>
      )}

      {/* Horizontal Stage Progression Labels */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 border-b border-gray-100">
        {stageList.map(({ stage, idx, stageProgress }) => {
          const isActive = idx === currentStageIdx;
          return (
            <span
              key={stage.key}
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border whitespace-nowrap ${
                isActive ? "bg-[#253C7D]/5 border-[#253C7D] text-[#253C7D]" : "bg-gray-50 border-gray-100 text-gray-400"
              }`}
            >
              {stage.shortLabel} ({stageProgress}%)
            </span>
          );
        })}
      </div>

      {/* 4 Columns Pipeline Grid Layout */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
          {stageList.map(({ stage, idx, stageDocs, stageProgress }) => (
            <OnboardingStageColumn
              key={stage.key}
              stage={stage}
              idx={idx}
              request={request}
              stageDocs={stageDocs}
              stageProgress={stageProgress}
              currentStageIdx={currentStageIdx}
              onAdvanceStage={onAdvanceStage}
              onRegressStage={onRegressStage}
              onCompleteOnboarding={onCompleteOnboarding}
              onOpenDocModal={onOpenDocModal}
              onOpenEditDocModal={onOpenEditDocModal}
              onBulkSetDeadline={onBulkSetDeadline}
              isDocOverdue={isDocOverdue}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}

      {showSetupModal && (
        <SetupRequirementsModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onboardingRequestId={request.id}
          employeeName={fullName}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
});
