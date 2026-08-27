import { memo } from "react";
import type { Interview } from "../../types";
import { formatScheduleDateTime } from "../../hireUtils";

interface CandidateInterviewsCardProps {
  interviews: Interview[];
  onOpenScheduleModal: () => void;
  onOpenFeedbackModal: (iv: Interview) => void;
}

export const CandidateInterviewsCard = memo(function CandidateInterviewsCard({
  interviews,
  onOpenScheduleModal,
  onOpenFeedbackModal,
}: CandidateInterviewsCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Interview History & Schedule
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {interviews.length} sessions recorded for this candidate
          </p>
        </div>
        <button
          onClick={onOpenScheduleModal}
          className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <i className="ri-calendar-event-line" />
          Schedule Interview
        </button>
      </div>

      <div className="space-y-3">
        {interviews.map((iv) => {
          const isCompleted = iv.status === "completed";

          return (
            <div
              key={iv.id}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                  <i
                    className={
                      iv.type === "video"
                        ? "ri-video-chat-line"
                        : iv.type === "in-person"
                        ? "ri-user-voice-line"
                        : "ri-phone-line"
                    }
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-gray-900 capitalize">
                      {iv.type} Interview
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {iv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {formatScheduleDateTime(iv.scheduled_at)} · {iv.duration_minutes || 60} mins
                  </p>
                  {iv.feedback && (
                    <p className="text-xs text-gray-600 italic mt-1 bg-white p-2 rounded-lg border border-gray-100">
                      "{iv.feedback}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {iv.score > 0 && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    ★ {iv.score}/5
                  </span>
                )}
                <button
                  onClick={() => onOpenFeedbackModal(iv)}
                  className="px-3 py-1 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-2xs transition-colors cursor-pointer"
                >
                  {isCompleted ? "Edit Feedback" : "Record Score"}
                </button>
              </div>
            </div>
          );
        })}

        {interviews.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-gray-200/80 rounded-2xl text-xs text-gray-400 font-semibold">
            No interviews have been scheduled for this candidate yet.
          </div>
        )}
      </div>
    </div>
  );
});
