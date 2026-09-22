import { memo } from "react";
import type { Review } from "../../types";

interface PerformanceReviewDetailPanelProps {
  review: Review | null;
  onClose: () => void;
  canManage?: boolean;
  onStartAppraisal?: (review: Review) => void;
}

export const PerformanceReviewDetailPanel = memo(function PerformanceReviewDetailPanel({
  review: selectedReview,
  onClose,
  canManage,
  onStartAppraisal,
}: PerformanceReviewDetailPanelProps) {
  if (!selectedReview) return null;
  const isSelf = selectedReview.status === "self_review";

  return (
    <div className="w-full lg:w-[380px] lg:shrink-0">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6 shadow-xs">
        <div className={`p-5 text-white ${
          isSelf
            ? "bg-gradient-to-br from-[#4c339c] to-[#7c3aed]"
            : "bg-gradient-to-br from-[#253C7D] to-[#29ABE2]"
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {isSelf ? "Self-Assessment" : "Evaluation"}
              </span>
              <p className="text-[11px] text-white/70 mt-1">
                {selectedReview.quarter} {selectedReview.year} {selectedReview.review_type || "Review"}
              </p>
              <h3 className="text-base font-bold mt-0.5">
                {selectedReview.employee?.first_name} {selectedReview.employee?.last_name}
              </h3>
              <p className="text-[12px] text-white/80">{selectedReview.employee?.role}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-white text-sm" />
            </button>
          </div>

          {selectedReview.overall_score && (
            <div className="mt-4 bg-white/15 rounded-lg p-3 flex items-center justify-between">
              <span className="text-[12px] text-white/80">{isSelf ? "Self Score" : "Overall Score"}</span>
              <span className="text-2xl font-black">{selectedReview.overall_score}</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[500px]">
          {isSelf && canManage && onStartAppraisal && (
            <button
              onClick={() => onStartAppraisal(selectedReview)}
              className="w-full py-2.5 px-4 bg-[#253C7D] text-white text-[13px] font-bold rounded-xl hover:bg-[#1f336a] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <i className="ri-edit-line" /> Complete Manager Appraisal
            </button>
          )}

          {selectedReview.employee_comments && (
            <div>
              <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <i className="ri-user-line" /> Employee Reflection
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed bg-purple-50/50 p-3 rounded-lg border border-purple-100/50">
                {selectedReview.employee_comments}
              </p>
            </div>
          )}

          {selectedReview.comments && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Manager Comments
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{selectedReview.comments}</p>
            </div>
          )}

          {selectedReview.strengths && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i className="ri-thumb-up-line" /> Strengths
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{selectedReview.strengths}</p>
            </div>
          )}

          {selectedReview.areas_for_improvement && (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <i className="ri-arrow-up-circle-line" /> Areas for Growth
              </p>
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {selectedReview.areas_for_improvement}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Evaluator / Manager
            </p>
            <p className="text-[13px] text-gray-700">
              {selectedReview.reviewer?.first_name} {selectedReview.reviewer?.last_name}
            </p>
            {selectedReview.submitted_at && (
              <p className="text-[11px] text-gray-400 mt-1">
                Submitted{" "}
                {new Date(selectedReview.submitted_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
