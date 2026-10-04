import { memo } from "react";
import type { Interview } from "../../types";

interface FeedbackModalProps {
  isOpen: boolean;
  interview: Interview | null;
  score: number;
  setScore: (score: number) => void;
  notes: string;
  setNotes: (notes: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FeedbackModal = memo(function FeedbackModal({
  isOpen,
  interview,
  score,
  setScore,
  notes,
  setNotes,
  saving,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  if (!isOpen || !interview) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className="ri-feedback-line" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Record Interview Feedback</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Evaluation for {interview.candidates?.full_name || "Applicant"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Performance Score
            </label>
            <div className="flex items-center justify-center gap-3 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  className={`text-2xl cursor-pointer transition-transform hover:scale-110 ${
                    star <= score ? "text-amber-400" : "text-gray-200"
                  }`}
                >
                  <i className={star <= score ? "ri-star-fill" : "ri-star-line"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Evaluation Remarks & Recommendations
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate problem solving, communication clarity, culture fit, recommendations..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
