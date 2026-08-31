import { memo } from "react";

interface CandidateEvaluationWidgetProps {
  rating: number;
  onRate: (star: number) => void;
}

export const CandidateEvaluationWidget = memo(function CandidateEvaluationWidget({
  rating,
  onRate,
}: CandidateEvaluationWidgetProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
        CANDIDATE EVALUATION
      </span>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className={`text-2xl cursor-pointer transition-colors ${
              star <= (rating || 0) ? "text-amber-400" : "text-gray-200 hover:text-amber-300"
            }`}
          >
            <i className={star <= (rating || 0) ? "ri-star-fill" : "ri-star-line"} />
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-gray-500">{rating || 0} / 5 Stars</p>
    </div>
  );
});
