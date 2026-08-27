import { memo } from "react";
import { Link } from "react-router-dom";

interface HiringOverviewSectionProps {
  jobs: any[];
  candidates: any[];
  canHire: boolean;
}

export const HiringOverviewSection = memo(function HiringOverviewSection({
  jobs,
  candidates,
  canHire,
}: HiringOverviewSectionProps) {
  if (!canHire) return null;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">Hiring Overview</h2>
        <Link to="/hire" className="text-[11px] text-[#253C7D] font-bold hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Open Positions */}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">Open Positions</h3>
          <div className="space-y-1">
            {jobs
              .filter((j) => j.status === "active")
              .slice(0, 5)
              .map((j) => (
                <Link
                  to="/hire"
                  key={j.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{j.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {j.department} &middot; {j.location}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#253C7D] font-medium shrink-0 ml-2">
                    ${j.salary_min?.toLocaleString()}k+
                  </span>
                </Link>
              ))}
            {jobs.filter((j) => j.status === "active").length === 0 && (
              <p className="text-[13px] text-gray-400 text-center py-4">No open positions</p>
            )}
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">Recent Applicants</h3>
          <div className="space-y-1">
            {candidates.slice(0, 5).map((c) => (
              <Link
                to={`/hire/candidates/${c.id}`}
                key={c.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-[11px] shrink-0">
                  {c.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{c.full_name}</p>
                  <p className="text-[11px] text-gray-500 truncate capitalize">
                    {c.stage} &middot;{" "}
                    {new Date(c.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
            {candidates.length === 0 && (
              <p className="text-[13px] text-gray-400 text-center py-4">No applicants yet</p>
            )}
          </div>
        </div>

        {/* Hiring Funnel */}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">Hiring Funnel</h3>
          <div className="space-y-2 mt-1">
            {[
              { stage: "Applied", count: candidates.filter((c) => c.stage === "applied").length, color: "bg-gray-300" },
              { stage: "Screening", count: candidates.filter((c) => c.stage === "screening").length, color: "bg-amber-400" },
              { stage: "Interview", count: candidates.filter((c) => c.stage === "interview").length, color: "bg-sky-400" },
              { stage: "Offer", count: candidates.filter((c) => c.stage === "offer").length, color: "bg-emerald-400" },
              { stage: "Hired", count: candidates.filter((c) => c.stage === "hired").length, color: "bg-[#253C7D]" },
            ].map((f) => (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 w-16 shrink-0">{f.stage}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${f.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max((f.count / Math.max(candidates.length, 1)) * 100, 8)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-700 w-6 text-right shrink-0">{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
