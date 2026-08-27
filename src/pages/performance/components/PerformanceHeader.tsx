import { memo } from "react";

interface PerformanceHeaderProps {
  canManage: boolean;
  onOpenAddGoal: () => void;
  onOpenSubmitReview: () => void;
}

export const PerformanceHeader = memo(function PerformanceHeader({
  canManage,
  onOpenAddGoal,
  onOpenSubmitReview,
}: PerformanceHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold text-[#1A1A1A]"
        >
          Performance Reviews
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {canManage
            ? "Quarterly ratings, comments, and goals tracking"
            : "Your quarterly ratings, comments, and goals"}
        </p>
      </div>

      {canManage && (
        <div className="flex gap-3">
          <button
            onClick={onOpenAddGoal}
            className="inline-flex items-center gap-2 border border-[#253C7D] text-[#253C7D] px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#253C7D]/5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-flag-line" /> Add Goal
          </button>
          <button
            onClick={onOpenSubmitReview}
            className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line" /> Submit Review
          </button>
        </div>
      )}
    </div>
  );
});
