import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { DEADLINE_PRESETS } from "../../constants";
import { OnboardingDocumentItem } from "./OnboardingDocumentItem";

interface StageInfo {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
}

interface OnboardingStageColumnProps {
  stage: StageInfo;
  idx: number;
  request: OnboardingRequest;
  stageDocs: OnboardingDoc[];
  stageProgress: number;
  currentStageIdx: number;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onRegressStage?: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
  onOpenDocModal: (req: OnboardingRequest, stageKey: string) => void;
  onOpenEditDocModal: (req: OnboardingRequest, doc: OnboardingDoc) => void;
  onBulkSetDeadline: (req: OnboardingRequest, stageKey: string, days: number) => void;
  isDocOverdue: (doc: OnboardingDoc) => boolean;
  onRefresh: () => void;
}

export const OnboardingStageColumn = memo(function OnboardingStageColumn({
  stage,
  idx,
  request,
  stageDocs,
  stageProgress,
  currentStageIdx,
  onAdvanceStage,
  onRegressStage,
  onCompleteOnboarding,
  onOpenDocModal,
  onOpenEditDocModal,
  onBulkSetDeadline,
  isDocOverdue,
  onRefresh,
}: OnboardingStageColumnProps) {
  const isCompletedJourney = request.status === "completed" || request.stage === "complete";
  const isActive = idx === currentStageIdx && request.status !== "pending" && !isCompletedJourney;
  const isCompleted = idx < currentStageIdx || isCompletedJourney;
  const isLocked = (idx > currentStageIdx && !isCompletedJourney) || request.status === "pending";

  return (
    <div
      className={`flex flex-col bg-gray-50/50 rounded-2xl border p-3.5 min-h-[380px] transition-all relative ${
        isActive ? "border-[#253C7D] bg-white ring-2 ring-[#253C7D]/5" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
              isCompleted ? "bg-emerald-500 text-white" : isActive ? "bg-[#253C7D] text-white" : "bg-gray-200 text-gray-400"
            }`}
          >
            {isCompleted ? <i className="ri-check-line" /> : idx + 1}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-black uppercase text-gray-900 truncate leading-tight">{stage.label}</h4>
            <p className="text-[9px] text-gray-400 truncate mt-0.5">{stage.description}</p>
          </div>
        </div>

        {isActive && (
          <button
            type="button"
            onClick={() => onOpenDocModal(request, stage.key)}
            title="Add checklist item"
            className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-[#253C7D] hover:text-white flex items-center justify-center text-gray-500 transition-colors cursor-pointer text-xs shrink-0"
          >
            <i className="ri-add-line" />
          </button>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 mb-1.5">
        <span>{stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length} verified</span>
        <span>{stageProgress}%</span>
      </div>
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-2.5 shrink-0">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${stageProgress}%` }} />
      </div>

      {isActive && stageDocs.length > 0 && (
        <div className="mb-2.5 flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-gray-200/80 rounded-xl text-[10px]">
          <span className="font-semibold text-gray-500 flex items-center gap-1 shrink-0">
            <i className="ri-calendar-event-line text-xs text-[#253C7D]" />
            Set Deadline:
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkSetDeadline(request, stage.key, Number(e.target.value));
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="text-[10px] font-bold bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs shrink-0"
          >
            <option value="" disabled>Choose...</option>
            {DEADLINE_PRESETS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

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

      <div className="mt-3.5 pt-2.5 border-t border-gray-100 shrink-0">
        {isActive ? (
          <div className="flex gap-2">
            {idx > 0 && (
              <button
                type="button"
                onClick={() => onRegressStage?.(request)}
                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-extrabold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1"
              >
                <i className="ri-arrow-left-line" />
                <span>Move Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => (idx === 3 ? onCompleteOnboarding(request) : onAdvanceStage(request))}
              className={`${idx > 0 ? "flex-1" : "w-full"} py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-[11px] font-extrabold rounded-xl shadow-2xs cursor-pointer flex items-center justify-center gap-1.5`}
            >
              <span>{idx === 3 ? "Complete Journey" : "Move On"}</span>
              <i className="ri-arrow-right-line" />
            </button>
          </div>
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
});
