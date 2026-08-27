import { memo } from "react";
import type { Interview } from "../../types";
import { InterviewCard } from "./InterviewCard";

interface InterviewsTabContentProps {
  interviews: Interview[];
  onOpenCreateInterview: () => void;
  onOpenFeedback: (interview: Interview) => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (id: string) => void;
}

export const InterviewsTabContent = memo(function InterviewsTabContent({
  interviews,
  onOpenCreateInterview,
  onOpenFeedback,
  onEditInterview,
  onDeleteInterview,
}: InterviewsTabContentProps) {
  if (interviews.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-calendar-todo-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Interviews Scheduled</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No interview sessions match your filters. Schedule a new interview for any applicant.
        </p>
        <button
          onClick={onOpenCreateInterview}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Schedule Interview
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {interviews.map((iv) => (
        <InterviewCard
          key={iv.id}
          interview={iv}
          onOpenFeedback={onOpenFeedback}
          onEdit={onEditInterview}
          onDelete={onDeleteInterview}
        />
      ))}
    </div>
  );
});
