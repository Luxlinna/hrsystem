import { memo } from "react";

interface PerformanceStatsRowProps {
  totalReviews: number;
  submitted: number;
  drafts: number;
  avgScore: number;
}

export const PerformanceStatsRow = memo(function PerformanceStatsRow({
  totalReviews,
  submitted,
  drafts,
  avgScore,
}: PerformanceStatsRowProps) {
  const stats = [
    { label: "Total Reviews", value: totalReviews, icon: "ri-file-list-3-line", color: "text-[#253C7D]" },
    { label: "Submitted", value: submitted, icon: "ri-checkbox-circle-line", color: "text-emerald-600" },
    { label: "Drafts", value: drafts, icon: "ri-draft-line", color: "text-amber-600" },
    { label: "Avg Score", value: `${avgScore.toFixed(1)} / 5`, icon: "ri-star-line", color: "text-violet-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <i className={`${s.icon} ${s.color} text-xl`} />
          <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
});
