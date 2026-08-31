import { memo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../types";
import { OnboardingExportMenu } from "./OnboardingExportMenu";

interface OnboardingHeaderProps {
  onStartOnboarding: () => void;
  requests: OnboardingRequest[];
  documents: OnboardingDoc[];
}

export const OnboardingHeader = memo(function OnboardingHeader({
  onStartOnboarding,
  requests,
  documents,
}: OnboardingHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Lifecycle Management</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">New Hires</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Employee Onboarding
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            4-Stage Workflow
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Guide new hires through document collection, IT equipment setup, orientation training, and final probation sign-off.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <OnboardingExportMenu requests={requests} documents={documents} />

        <button
          onClick={onStartOnboarding}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-user-add-line text-base font-bold" />
          Start Onboarding
        </button>
      </div>
    </div>
  );
});
