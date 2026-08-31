import { memo } from "react";
import type { Interview } from "../../types";
import { formatScheduleDateTime } from "../../hireUtils";

interface CandidateInterviewsCardProps {
  interviews: Interview[];
  avgScore: number;
  onOpenFeedbackModal: (iv: Interview) => void;
}

export const CandidateInterviewsCard = memo(function CandidateInterviewsCard({
  interviews,
  avgScore,
  onOpenFeedbackModal,
}: CandidateInterviewsCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">
            <i className="ri-calendar-todo-line" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Interview History</h2>
        </div>
        <div className="text-xs text-gray-500 font-semibold flex items-center gap-2">
          <span>{interviews.length} Total</span>
          <span>|</span>
          <span>{interviews.filter((i) => i.status === "completed").length} Completed</span>
          <span>|</span>
          <span className="text-[#172B4D] font-extrabold">Avg Score: {avgScore.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {interviews.map((iv) => {
          const isCompleted = iv.status === "completed";
          return (
            <div
              key={iv.id}
              className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {iv.status}
                  </span>
                  <span className="text-xs font-bold text-gray-900 capitalize">
                    {iv.type} Interview
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <i className="ri-calendar-line text-gray-400" /> {formatScheduleDateTime(iv.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-time-line text-gray-400" /> {iv.duration_minutes || 60} mins
                  </span>
                  {iv.employees && (
                    <span className="flex items-center gap-1">
                      <i className="ri-user-line text-gray-400" /> {iv.employees.first_name}{" "}
                      {iv.employees.last_name}
                    </span>
                  )}
                </div>
                {iv.notes && <p className="text-xs text-gray-600 italic">Notes: {iv.notes}</p>}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                {iv.score > 0 && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    ★ {iv.score}/5
                  </span>
                )}
                <button
                  onClick={() => onOpenFeedbackModal(iv)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-edit-line text-xs" /> {isCompleted ? "Edit Feedback" : "Record Score"}
                </button>
              </div>
            </div>
          );
        })}

        {interviews.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-xs text-gray-400">
            No interview sessions scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
});
