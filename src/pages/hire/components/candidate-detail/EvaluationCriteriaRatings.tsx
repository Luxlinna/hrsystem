import { memo } from "react";

interface EvaluationCriteriaRatingsProps {
  criteria: string[];
  competencyScores: Record<string, number>;
  onUpdateCompetencyScore: (crit: string, val: number) => void;
  overallScore: number;
  onUpdateOverallScore: (score: number) => void;
}

export const EvaluationCriteriaRatings = memo(function EvaluationCriteriaRatings({
  criteria,
  competencyScores,
  onUpdateCompetencyScore,
  overallScore,
  onUpdateOverallScore,
}: EvaluationCriteriaRatingsProps) {
  return (
    <div className="space-y-4">
      {/* Competency Ratings */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
          Competency Criteria Ratings (1–5)
        </label>
        <div className="space-y-2.5 bg-gray-50/60 p-3.5 rounded-2xl border border-gray-100">
          {criteria.map((crit) => {
            const score = competencyScores[crit] || 4;
            return (
              <div key={crit} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700">{crit}</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateCompetencyScore(crit, val)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        val === score
                          ? "bg-[#253C7D] text-white shadow-2xs scale-105"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            Overall Performance Rating
          </label>
          <span className="text-xs font-black text-[#253C7D]">
            {overallScore === 5
              ? "5/5 - Exceptional Fit"
              : overallScore === 4
              ? "4/5 - Strong Candidate"
              : overallScore === 3
              ? "3/5 - Meets Requirements"
              : overallScore === 2
              ? "2/5 - Borderline / Gaps"
              : "1/5 - Unsatisfactory"}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onUpdateOverallScore(star)}
              className={`text-2xl cursor-pointer transition-transform hover:scale-115 ${
                star <= overallScore ? "text-amber-400" : "text-gray-200"
              }`}
            >
              <i className={star <= overallScore ? "ri-star-fill" : "ri-star-line"} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
