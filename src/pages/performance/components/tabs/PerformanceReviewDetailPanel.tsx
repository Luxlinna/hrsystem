import { memo } from "react";
import type { Review } from "../../types";

interface PerformanceReviewDetailPanelProps {
  review: Review | null;
  onClose: () => void;
}

export const PerformanceReviewDetailPanel = memo(function PerformanceReviewDetailPanel({
  review: selectedReview,
  onClose,
}: PerformanceReviewDetailPanelProps) {
  if (!selectedReview) return null;

  return (
    <div className="w-full lg:w-[380px] lg:shrink-0">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6 shadow-xs">
        <div className="bg-gradient-to-br from-[#253C7D] to-[#29ABE2] p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-white/60">
                {selectedReview.quarter} {selectedReview.year} Review
              </p>
              <h3 className="text-base font-bold mt-1">
                {selectedReview.employee?.first_name} {selectedReview.employee?.last_name}
              </h3>
              <p className="text-[12px] text-white/70">{selectedReview.employee?.role}</p>
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
              <span className="text-[12px] text-white/80">Overall Score</span>
              <span className="text-2xl font-black">{selectedReview.overall_score}</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[500px]">
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
              Reviewed by
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
