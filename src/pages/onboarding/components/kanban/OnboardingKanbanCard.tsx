import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../../types";
import { initials, getOverallProgress } from "../../onboardingUtils";

interface OnboardingKanbanCardProps {
  request: OnboardingRequest;
  documents: OnboardingDoc[];
  onSelectRequest: (id: string) => void;
  onAdvanceStage: (req: OnboardingRequest) => void;
  onCompleteOnboarding: (req: OnboardingRequest) => void;
}

export const OnboardingKanbanCard = memo(function OnboardingKanbanCard({
  request,
  documents,
  onSelectRequest,
  onAdvanceStage,
  onCompleteOnboarding,
}: OnboardingKanbanCardProps) {
  const emp = request.employees;
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
  const overallProgress = getOverallProgress(request, documents);

  return (
    <div
      onClick={() => onSelectRequest(request.id)}
      className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] font-black text-xs flex items-center justify-center shrink-0">
            {initials(emp?.first_name, emp?.last_name)}
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-xs text-gray-900 truncate group-hover:text-[#253C7D]">
              {fullName}
            </h4>
            <p className="text-[10px] text-gray-400 truncate">{emp?.role || "Staff"}</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
          {overallProgress}%
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            request.status === "completed" ? "bg-emerald-500" : "bg-[#253C7D]"
          }`}
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px] text-gray-400">
        <span className="truncate">{emp?.department || "General"}</span>

        {request.stage === "complete" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompleteOnboarding(request);
            }}
            className="text-emerald-600 font-bold hover:underline"
          >
            Graduate &radic;
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage(request);
            }}
            className="text-[#253C7D] font-bold hover:underline flex items-center gap-0.5"
          >
            <span>Next</span>
            <i className="ri-arrow-right-s-line" />
          </button>
        )}
      </div>
    </div>
  );
});
