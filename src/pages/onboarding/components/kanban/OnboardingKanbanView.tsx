import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { STAGES } from "../../constants";
import { OnboardingKanbanCard } from "./OnboardingKanbanCard";

interface OnboardingKanbanViewProps {
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
  onSelectRequest: (id: string) => void;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
}

export const OnboardingKanbanView = memo(function OnboardingKanbanView({
  requests,
  documents,
  onSelectRequest,
  onAdvanceStage,
  onCompleteOnboarding,
}: OnboardingKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {STAGES.map((stage, idx) => {
        const stageRequests = requests.filter((r) => r.stage === stage.key);

        return (
          <div
            key={stage.key}
            className="bg-slate-100/70 rounded-3xl p-4 border border-gray-200/60 min-h-[450px] flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3.5 px-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-[#253C7D] text-white font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <h4 className="font-extrabold text-xs text-gray-900">{stage.shortLabel}</h4>
              </div>
              <span className="text-[10px] font-black text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
                {stageRequests.length}
              </span>
            </div>

            {/* Cards Column */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {stageRequests.map((req) => (
                <OnboardingKanbanCard
                  key={req.id}
                  request={req}
                  documents={documents}
                  onSelectRequest={onSelectRequest}
                  onAdvanceStage={onAdvanceStage}
                  onCompleteOnboarding={onCompleteOnboarding}
                />
              ))}

              {stageRequests.length === 0 && (
                <div className="h-32 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-400 font-medium">
                  No new hires in this step
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
