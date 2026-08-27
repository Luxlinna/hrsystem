import { memo } from "react";
import type { Review } from "../../types";
import { PerformanceReviewCard } from "./PerformanceReviewCard";
import { PerformanceReviewDetailPanel } from "./PerformanceReviewDetailPanel";

interface PerformanceReviewsTabProps {
  reviews: Review[];
  selectedReview: Review | null;
  onSelectReview: (review: Review | null) => void;
  filterQ: string;
  setFilterQ: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterDept: string;
  setFilterDept: (d: string) => void;
  departments: string[];
}

export const PerformanceReviewsTab = memo(function PerformanceReviewsTab({
  reviews,
  selectedReview,
  onSelectReview,
  filterQ,
  setFilterQ,
  filterStatus,
  setFilterStatus,
  filterDept,
  setFilterDept,
  departments,
}: PerformanceReviewsTabProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className={`flex-1 min-w-0 transition-all ${selectedReview ? "lg:max-w-[60%]" : ""}`}>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Quarters</option>
            <option value="Q1">Q1 2026</option>
            <option value="Q2">Q2 2026</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {reviews.map((r) => (
            <PerformanceReviewCard
              key={r.id}
              review={r}
              isSelected={selectedReview?.id === r.id}
              onSelect={(rev) => onSelectReview(selectedReview?.id === rev.id ? null : rev)}
            />
          ))}

          {reviews.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs">
              <i className="ri-file-list-3-line text-4xl text-gray-200" />
              <p className="text-gray-400 mt-2">No reviews found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <PerformanceReviewDetailPanel
        review={selectedReview}
        onClose={() => onSelectReview(null)}
      />
    </div>
  );
});
