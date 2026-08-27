import { memo } from "react";
import type { Review } from "../../types";
import { scoreColor, scoreBg } from "../../performanceUtils";

interface PerformanceReviewCardProps {
  review: Review;
  isSelected: boolean;
  onSelect: (review: Review) => void;
}

export const PerformanceReviewCard = memo(function PerformanceReviewCard({
  review: r,
  isSelected,
  onSelect,
}: PerformanceReviewCardProps) {
  return (
    <div
      onClick={() => onSelect(r)}
      className={`bg-white border rounded-xl p-5 cursor-pointer hover:border-[#253C7D]/30 transition-all shadow-2xs ${
        isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-100"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-xs shrink-0">
            {r.employee?.first_name?.[0]}
            {r.employee?.last_name?.[0]}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">
              {r.employee?.first_name} {r.employee?.last_name}
            </p>
            <p className="text-[11px] text-gray-500">
              {r.employee?.role} &middot; {r.employee?.department}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {r.quarter} {r.year}
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              r.status === "submitted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {r.status}
          </span>
          {r.overall_score && (
            <span className={`text-[15px] font-bold ${scoreColor(r.overall_score)}`}>
              {r.overall_score}
            </span>
          )}
        </div>
      </div>

      {r.overall_score && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Communication", score: r.communication_score },
            { label: "Teamwork", score: r.teamwork_score },
            { label: "Technical", score: r.technical_score },
            { label: "Leadership", score: r.leadership_score },
          ].map((metric) => (
            <div key={metric.label} className={`rounded-lg p-2 text-center ${scoreBg(metric.score || 0)}`}>
              <p className={`text-[14px] font-bold ${scoreColor(metric.score || 0)}`}>{metric.score}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">{metric.label}</p>
            </div>
          ))}
        </div>
      )}

      {r.comments && (
        <p className="mt-3 text-[12px] text-gray-600 line-clamp-2 border-t border-gray-50 pt-3">
          &ldquo;{r.comments}&rdquo;
        </p>
      )}
    </div>
  );
});
