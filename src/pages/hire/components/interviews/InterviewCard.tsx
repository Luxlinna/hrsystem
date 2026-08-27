import { memo } from "react";
import type { Interview } from "../../types";
import { formatScheduleDateTime } from "../../hireUtils";

interface InterviewCardProps {
  interview: Interview;
  onOpenFeedback: (interview: Interview) => void;
  onEdit: (interview: Interview) => void;
  onDelete: (id: string) => void;
}

export const InterviewCard = memo(function InterviewCard({
  interview,
  onOpenFeedback,
  onEdit,
  onDelete,
}: InterviewCardProps) {
  const isCompleted = interview.status === "completed";
  const isScheduled = interview.status === "scheduled";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isScheduled
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              ● {interview.status}
            </span>
            <h4 className="font-extrabold text-base text-gray-900 group-hover:text-[#253C7D] transition-colors mt-1 truncate">
              {interview.candidates?.full_name || "Applicant"}
            </h4>
            <p className="text-xs text-gray-400 font-medium truncate">
              {interview.candidates?.job_postings?.title || "Direct"}
            </p>
          </div>

          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
            <i
              className={
                interview.type === "video"
                  ? "ri-video-chat-line"
                  : interview.type === "in-person"
                  ? "ri-user-voice-line"
                  : "ri-phone-line"
              }
            />
          </div>
        </div>

        {/* Schedule & Duration Information */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5 text-gray-500 font-medium">
              <i className="ri-time-line text-[#253C7D]" />
              Schedule:
            </span>
            <span className="font-extrabold text-gray-900">
              {formatScheduleDateTime(interview.scheduled_at)}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-600">
            <span className="text-gray-500 font-medium">Duration:</span>
            <span className="font-bold text-gray-800">{interview.duration_minutes || 60} mins</span>
          </div>

          {interview.employees && (
            <div className="flex items-center justify-between text-gray-600">
              <span className="text-gray-500 font-medium">Interviewer:</span>
              <span className="font-bold text-gray-800">
                {interview.employees.first_name} {interview.employees.last_name}
              </span>
            </div>
          )}
        </div>

        {/* Score and Notes if present */}
        {interview.score > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs mb-3">
            <span className="text-emerald-800 font-semibold">Evaluation Score:</span>
            <span className="font-black text-emerald-700">{interview.score} / 5</span>
          </div>
        )}

        {interview.feedback && (
          <p className="text-[11px] text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100 line-clamp-2 mb-3 leading-relaxed">
            "{interview.feedback}"
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
        <button
          onClick={() => onOpenFeedback(interview)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            isCompleted
              ? "text-gray-600 hover:bg-gray-100"
              : "bg-[#253C7D] text-white hover:bg-[#1E3064] shadow-xs"
          }`}
        >
          <i className="ri-feedback-line" />
          {isCompleted ? "Edit Feedback" : "Record Feedback"}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(interview)}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Edit"
          >
            <i className="ri-edit-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(interview.id)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
