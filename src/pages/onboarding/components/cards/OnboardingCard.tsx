import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES, DEADLINE_PRESETS } from "../../constants";
import { OnboardingDocumentItem } from "./OnboardingDocumentItem";
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
  }, [request.id, request.stage, getDocsForRequestAndStage, getStageProgress, isStageComplete]);

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
            onClick={() => navigate(`/onboarding-checklist?hire=${request.id}`)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/50 rounded-xl text-xs font-bold text-[#253C7D] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="ri-task-line" />
            <span>Checklist</span>
          </button>
          <button
            onClick={() => onToggleExpand(request.id)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
          <button
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
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
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
                isActive
                  ? "bg-[#253C7D]/5 border-[#253C7D] text-[#253C7D]"
                  : "bg-gray-50 border-gray-100 text-gray-400"
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
          {stageList.map(({ stage, idx, stageDocs, stageProgress }) => {
            const isActive = idx === currentStageIdx && request.status !== "pending";
            const isCompleted = idx < currentStageIdx || request.status === "completed";
            const isLocked = idx > currentStageIdx || request.status === "pending";

            return (
              <div
                key={stage.key}
                className={`flex flex-col bg-gray-50/50 rounded-2xl border p-3.5 min-h-[380px] transition-all relative ${
                  isActive ? "border-[#253C7D] bg-white ring-2 ring-[#253C7D]/5" : "border-gray-200"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-start justify-between gap-1 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                      isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-[#253C7D] text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {isCompleted ? <i className="ri-check-line" /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-black uppercase text-gray-900 truncate leading-tight">{stage.label}</h4>
                      <p className="text-[9px] text-gray-400 truncate mt-0.5">{stage.description}</p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        onChange={(e) => onBulkSetDeadline(request, stage.key, Number(e.target.value))}
                        defaultValue=""
                        className="text-[9px] font-bold bg-white border border-gray-200 rounded px-1 py-0.5 text-gray-600 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                      >
                        <option value="" disabled>Deadline</option>
                        {DEADLINE_PRESETS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
                      </select>
                      <button
                        onClick={() => onOpenDocModal(request, stage.key)}
                        className="w-5 h-5 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer font-bold text-xs"
                      >
                        <i className="ri-add-line" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub progress line */}
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-2">
                  <span>{stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length} verified</span>
                  <span>{stageProgress}%</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-3 shrink-0">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stageProgress}%` }} />
                </div>

                {/* Tasks List */}
                <div className={`flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-0.5 ${isLocked ? "opacity-40 pointer-events-none" : ""}`}>
                  {stageDocs.map((doc) => (
                    <OnboardingDocumentItem
                      key={doc.id}
                      doc={doc}
                      request={request}
                      isOverdue={isDocOverdue(doc)}
                      onOpenEditDocModal={onOpenEditDocModal}
                      onRefresh={onRefresh}
                    />
                  ))}
                  {stageDocs.length === 0 && (
                    <div className="h-28 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[10px] text-gray-400 font-semibold">
                      No items in stage
                    </div>
                  )}
                </div>

                {/* Column Action Bottom */}
                <div className="mt-3.5 pt-2.5 border-t border-gray-100 shrink-0">
                  {isActive ? (
                    <button
                      onClick={() => idx === 3 ? onCompleteOnboarding(request) : onAdvanceStage(request)}
                      className="w-full py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-extrabold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{idx === 3 ? "Complete Journey" : "Move On"}</span>
                      <i className="ri-arrow-right-line" />
                    </button>
                  ) : isCompleted ? (
                    <div className="text-center text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1 py-1">
                      <i className="ri-checkbox-circle-fill text-sm" />
                      <span>Completed</span>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-gray-400 flex items-center justify-center gap-1 py-1 bg-gray-100/50 rounded-lg">
                      <i className="ri-lock-line" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
