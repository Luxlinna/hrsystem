import { memo, useMemo, useState } from "react";
import type { OnboardingRequest, OnboardingDoc, HireDocument } from "../../types";
import { DEADLINE_PRESETS } from "../../constants";
import { OnboardingDocumentItem } from "./OnboardingDocumentItem";
import {
  getHireDocIcon,
  getHireDocColor,
  matchHireDocToOnboardingDoc,
  findUnsyncedMatchingHireDocs,
} from "../../utils/hireDocumentUtils";

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
  hireDocs?: HireDocument[];
  onSyncHireDocs?: (req: OnboardingRequest, hireDocs: HireDocument[]) => void;
  onAttachHireDoc?: (req: OnboardingRequest, doc: OnboardingDoc, hireDoc: HireDocument) => void;
  onAddHireDocToChecklist?: (req: OnboardingRequest, hireDoc: HireDocument, stageKey: string) => void;
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
  hireDocs = [],
  onSyncHireDocs,
  onAttachHireDoc,
  onAddHireDocToChecklist,
}: OnboardingStageColumnProps) {
  const isCompletedJourney = request.status === "completed" || request.stage === "complete";
  const isActive = idx === currentStageIdx && request.status !== "pending" && !isCompletedJourney;
  const isCompleted = idx < currentStageIdx || isCompletedJourney;
  const isLocked = (idx > currentStageIdx && !isCompletedJourney) || request.status === "pending";

  const [showHireDocs, setShowHireDocs] = useState(true);
  const isDocStage = stage.key === "document";
  const unsyncedMatches = useMemo(() => {
    if (!isDocStage) return [];
    return findUnsyncedMatchingHireDocs(stageDocs, hireDocs);
  }, [isDocStage, stageDocs, hireDocs]);

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

      {isDocStage && unsyncedMatches.length > 0 && isActive && (
        <div className="mb-2.5 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl text-[10px] flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-md bg-[#253C7D] text-white flex items-center justify-center shrink-0 text-[10px]">
              <i className="ri-folder-shared-line" />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-[#253C7D] truncate">
                {unsyncedMatches.length} hiring document{unsyncedMatches.length > 1 ? "s" : ""} match
              </p>
              <p className="text-[9px] text-gray-500 truncate">
                Auto-fill verified files to checklist
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSyncHireDocs?.(request, hireDocs)}
            className="px-2 py-1 bg-[#253C7D] hover:bg-[#1E3064] text-white font-black rounded-lg shadow-2xs cursor-pointer text-[10px] shrink-0"
          >
            Sync All
          </button>
        </div>
      )}

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

      <div className={`flex-1 space-y-2 overflow-y-auto max-h-[260px] pr-0.5 ${isLocked ? "opacity-40 pointer-events-none" : ""}`}>
        {stageDocs.map((doc) => {
          const matchingHireDoc = matchHireDocToOnboardingDoc(doc.document_name, hireDocs);
          return (
            <OnboardingDocumentItem
              key={doc.id}
              doc={doc}
              request={request}
              isOverdue={isDocOverdue(doc)}
              onOpenEditDocModal={onOpenEditDocModal}
              onRefresh={onRefresh}
              matchingHireDoc={matchingHireDoc}
              onAttachHireDoc={
                matchingHireDoc && onAttachHireDoc
                  ? (hDoc) => onAttachHireDoc(request, doc, hDoc)
                  : undefined
              }
            />
          );
        })}
        {stageDocs.length === 0 && (
          <div className="h-24 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[10px] text-gray-400 font-semibold">
            No items in stage
          </div>
        )}

        {/* Collected from Hiring Section */}
        {isDocStage && hireDocs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
            <button
              type="button"
              onClick={() => setShowHireDocs(!showHireDocs)}
              className="w-full flex items-center justify-between gap-2 mb-2 cursor-pointer text-left"
            >
              <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1">
                <i className="ri-folder-user-line text-xs text-indigo-600" />
                Submitted in Hiring ({hireDocs.length})
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  Hire Portal
                </span>
                <i className={`ri-arrow-down-s-line text-xs text-indigo-500 transition-transform ${showHireDocs ? "rotate-180" : ""}`} />
              </div>
            </button>

            {showHireDocs && (
              <div className="space-y-1.5">
                {hireDocs.map((h, hIdx) => {
                  const isAlreadyInStage = stageDocs.some(
                    (d) => d.file_url === h.url || d.document_name.toLowerCase() === h.name.toLowerCase()
                  );
                  const colors = getHireDocColor(h.doc_slot_key, h.name);
                  return (
                    <div
                      key={h.url || hIdx}
                      className="p-2 rounded-xl bg-white border border-gray-200/90 shadow-2xs hover:border-indigo-300 transition-all flex items-center justify-between gap-2 text-[10px]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`w-6 h-6 rounded-lg ${colors.bg} ${colors.text} border ${colors.border} flex items-center justify-center shrink-0 text-xs`}
                        >
                          <i className={getHireDocIcon(h.doc_slot_key, h.name)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-gray-900 truncate leading-tight" title={h.name}>
                            {h.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-400 mt-0.5">
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <i className="ri-checkbox-circle-fill text-[10px]" />
                              {h.verification_status === "verified" ? "Verified in Hire" : "Uploaded"}
                            </span>
                            {h.size && <span>&middot; {Math.round(h.size / 1024)} KB</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 px-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 font-bold rounded-md border border-gray-200/80 hover:border-indigo-200 flex items-center gap-0.5 transition-colors"
                          title="View or download document"
                        >
                          <i className="ri-external-link-line text-xs" />
                          <span>View</span>
                        </a>
                        {!isAlreadyInStage && onAddHireDocToChecklist && (
                          <button
                            type="button"
                            onClick={() => onAddHireDocToChecklist(request, h, stage.key)}
                            className="p-1 px-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 font-bold rounded-md border border-gray-200/80 hover:border-emerald-200 flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="Add as checklist requirement in this stage"
                          >
                            <i className="ri-add-line text-xs" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
