import { memo } from "react";
import { Link } from "react-router-dom";

interface OnboardingPipelineSectionProps {
  onboarding: any[];
  canOnboarding: boolean;
}

export const OnboardingPipelineSection = memo(function OnboardingPipelineSection({
  onboarding,
  canOnboarding,
}: OnboardingPipelineSectionProps) {
  if (!canOnboarding) return null;

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">Onboarding Pipeline</h2>
        <span className="text-[11px] text-gray-500">{onboarding.length} in progress</span>
      </div>

      <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-hide">
        {onboarding.length > 0 ? (
          onboarding.map((o) => (
            <Link
              to="/onboarding"
              key={o.id}
              className="min-w-[210px] rounded-xl p-4 bg-gradient-to-br from-[#253C7D] to-[#1E3066] text-white relative overflow-hidden hover:shadow-md transition-shadow shrink-0"
            >
              <span className="absolute top-3 right-3 bg-white/20 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full">
                Day {o.day_count || 1}
              </span>
              <div className="mt-6">
                <p className="text-sm font-bold">
                  {o.employees?.first_name} {o.employees?.last_name}
                </p>
                <p className="text-[12px] text-white/80 mt-0.5">{o.employees?.role || "New Hire"}</p>
                <p className="text-[10px] text-white/60 mt-2.5 capitalize">
                  Stage: {o.stage?.replace("_", " ") || "Welcome"}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="min-w-[210px] rounded-xl p-4 bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-400 text-center shrink-0">
            <i className="ri-user-add-line text-xl mb-1.5" />
            <p className="text-[12px] font-medium">No onboarding in progress</p>
          </div>
        )}

        <Link
          to="/onboarding"
          className="min-w-[140px] rounded-xl p-4 bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500 hover:border-[#253C7D] hover:text-[#253C7D] transition-colors shrink-0"
        >
          <i className="ri-arrow-right-circle-line text-2xl mb-1.5" />
          <span className="text-[12px] font-semibold">View All</span>
        </Link>
      </div>
    </div>
  );
});
