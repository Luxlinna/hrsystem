import { memo } from "react";
import type { HireTab } from "../types";

interface HireHeaderProps {
  activeJobsCount: number;
  candidatesCount: number;
  activeTab: HireTab;
  canManage: boolean;
  onOpenCreateJob: () => void;
  onOpenCreateCandidate: () => void;
  onOpenCreateInterview: () => void;
  onOpenCreateRequest: () => void;
}

export const HireHeader = memo(function HireHeader({
  activeJobsCount,
  activeTab,
  canManage,
  onOpenCreateJob,
  onOpenCreateCandidate,
  onOpenCreateInterview,
  onOpenCreateRequest,
}: HireHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Talent Acquisition</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Recruitment Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Recruitment & Hiring
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {activeJobsCount} Active Jobs
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage open vacancies, evaluate applicant pipelines, schedule candidate interviews, and transition new hires.
        </p>
      </div>

      {/* Top Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {activeTab === "candidates" && (
          <button
            type="button"
            onClick={onOpenCreateCandidate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-user-add-line text-sm" />
            + Add Candidate
          </button>
        )}

        {activeTab === "interviews" && (
          <button
            type="button"
            onClick={onOpenCreateInterview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-calendar-event-line text-sm" />
            + Schedule Interview
          </button>
        )}

        {activeTab === "requests" ? (
          <button
            type="button"
            onClick={onOpenCreateRequest}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-user-add-line text-base font-bold" />
            Request New Employee
          </button>
        ) : (
          canManage && (
            <button
              type="button"
              onClick={onOpenCreateJob}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-briefcase-line text-base font-bold" />
              Post New Job
            </button>
          )
        )}
      </div>
    </div>
  );
});
