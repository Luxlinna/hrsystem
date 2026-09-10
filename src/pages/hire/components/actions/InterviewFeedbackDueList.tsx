import { memo } from "react";
import type { Interview } from "../../types";
import { formatDateTime } from "../../hireUtils";

interface InterviewFeedbackDueListProps {
  interviews: Interview[];
  onOpenFeedback: (interview: Interview) => void;
}

export const InterviewFeedbackDueList = memo(function InterviewFeedbackDueList({
  interviews,
  onOpenFeedback,
}: InterviewFeedbackDueListProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
            <i className="ri-feedback-line" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Interview Feedback Due</h3>
            <p className="text-[11px] text-gray-400">
              Interviews assigned to your role or department awaiting evaluation notes
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          {interviews.length} Due
        </span>
      </div>

      {interviews.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <i className="ri-check-double-line text-3xl text-emerald-500 mb-1" />
          <p className="text-xs font-bold text-gray-700">All interview feedback submitted!</p>
          <p className="text-[11px] text-gray-400">No pending interview scorecards for this role.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const isOverdue =
              iv.scheduled_at && new Date(iv.scheduled_at).getTime() < Date.now();

            return (
              <div
                key={iv.id}
                className="p-4 rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-base font-bold shrink-0">
                    <i className="ri-user-voice-line" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">
                        {iv.candidates?.full_name || "Applicant"}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {iv.type || "Interview"} Round
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          Feedback Overdue
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                      Position: {iv.candidates?.job_postings?.title || "Requisition"} •{" "}
                      <span className="text-gray-400">
                        {iv.candidates?.job_postings?.department || "General"}
                      </span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                      <span>
                        <i className="ri-calendar-event-line mr-1 text-gray-400" />
                        {formatDateTime(iv.scheduled_at)}
                      </span>
                      {iv.employees && (
                        <span>
                          <i className="ri-user-follow-line mr-1 text-gray-400" />
                          Interviewer: {iv.employees.first_name} {iv.employees.last_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenFeedback(iv)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-edit-box-line" />
                    Record Feedback
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
