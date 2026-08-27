import { memo, useState } from "react";
import type { OnboardingRequest, OnboardingDoc, StageConfig } from "../../types";
import { OnboardingDocumentItem } from "./OnboardingDocumentItem";
import { DEADLINE_PRESETS } from "../../constants";

interface OnboardingStageAccordionProps {
  stage: StageConfig;
  stageIdx: number;
  currentStageIdx: number;
  request: OnboardingRequest;
  stageDocs: OnboardingDoc[];
  stageProgress: number;
  isComplete: boolean;
  onOpenDocModal: (req: OnboardingRequest, stageKey: string) => void;
  onOpenEditDocModal: (req: OnboardingRequest, doc: OnboardingDoc) => void;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
  onBulkSetDeadline: (req: OnboardingRequest, stageKey: string, days: number) => void;
  onRefresh: () => void;
  isDocOverdue: (doc: OnboardingDoc) => boolean;
}

export const OnboardingStageAccordion = memo(function OnboardingStageAccordion({
  stage,
  stageIdx,
  currentStageIdx,
  request,
  stageDocs,
  stageProgress,
  isComplete,
  onOpenDocModal,
  onOpenEditDocModal,
  onAdvanceStage,
  onCompleteOnboarding,
  onBulkSetDeadline,
  onRefresh,
  isDocOverdue,
}: OnboardingStageAccordionProps) {
  const isCurrent = stageIdx === currentStageIdx;
  const isPassed = stageIdx < currentStageIdx || request.status === "completed";
  const [open, setOpen] = useState(isCurrent || (isPassed && stageProgress < 100));

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isCurrent
          ? "border-[#253C7D] bg-white shadow-2xs"
          : isPassed
          ? "border-emerald-200 bg-emerald-50/20"
          : "border-gray-200 bg-gray-50/40"
      }`}
    >
      {/* Accordion Header */}
      <div
        onClick={() => setOpen(!open)}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 select-none transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isPassed
                ? "bg-emerald-500 text-white"
                : isCurrent
                ? "bg-[#253C7D] text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {isPassed ? (
              <i className="ri-check-line text-sm font-bold" />
            ) : (
              <i className={`${stage.icon} text-sm`} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs text-gray-900 truncate">
                Step {stageIdx + 1}: {stage.label}
              </span>
              {isCurrent && (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
                  Active Step
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate">{stage.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs font-black text-gray-800">{stageProgress}%</span>
            <p className="text-[10px] text-gray-400">
              {stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length}
            </p>
          </div>
          <i className={`ri-arrow-down-s-line text-base text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Accordion Body */}
      {open && (
        <div className="p-3.5 pt-0 space-y-2 border-t border-gray-100 bg-white/70">
          {/* Preset Deadlines Row */}
          {stageDocs.length > 0 && stageDocs.some((d) => !d.due_date && d.status !== "complete") && (
            <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-gray-400 font-bold">Quick Due Date:</span>
              {DEADLINE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onBulkSetDeadline(request, stage.key, p.days)}
                  className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-1.5 pt-1">
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
          </div>

          {/* Actions: Add Item & Stage Progression */}
          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => onOpenDocModal(request, stage.key)}
              className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-add-line" />
              Add Checklist Item
            </button>

            {isCurrent && request.status === "approved" && (
              <>
                {stage.key === "complete" ? (
                  <button
                    onClick={() => onCompleteOnboarding(request)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-checkbox-circle-line" />
                    Graduate & Complete Onboarding
                  </button>
                ) : (
                  <button
                    onClick={() => onAdvanceStage(request)}
                    className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Advance to Next Step</span>
                    <i className="ri-arrow-right-line" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
