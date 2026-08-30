import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES } from "../../constants";
import { initials, getOverallProgress } from "../../onboardingUtils";
import { OnboardingStageColumn } from "./OnboardingStageColumn";

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
  const navigate = useNavigate();
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
      {/* Profile & Main Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
            {initials(emp?.first_name, emp?.last_name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-gray-900 leading-tight">{fullName}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                request.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700"
              }`}>
                {request.status}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                Day {request.day_count}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-1">
              {emp?.role || "Staff"} &middot; {emp?.department || "General"} &middot; {emp?.branches?.name || "HQ"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/onboarding-checklist?hire=${request.id}`)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 rounded-xl text-xs font-bold text-[#253C7D] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="ri-task-line" />
            <span>Checklist</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleExpand(request.id)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(request)}
            className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Delete Request"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>

      {/* Progress Section */}
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
    </div>
  );
});
