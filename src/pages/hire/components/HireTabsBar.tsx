import { memo } from "react";
import type { HireTab } from "../types";

interface HireTabsBarProps {
  activeTab?: HireTab;
  setActiveTab?: (tab: HireTab) => void;
  tab?: HireTab;
  setTab?: (tab: HireTab) => void;
  jobsCount: number;
  candidatesCount: number;
  interviewsCount: number;
  requestsCount?: number;
  pendingRequestsCount?: number;
  isChairman?: boolean;
}

export const HireTabsBar = memo(function HireTabsBar({
  activeTab,
  setActiveTab,
  tab,
  setTab,
  jobsCount,
  candidatesCount,
  interviewsCount,
  requestsCount,
  pendingRequestsCount = 0,
}: HireTabsBarProps) {
  const currentTab = activeTab || tab || "requests";
  const handleSelectTab = (tKey: HireTab) => {
    if (setActiveTab) setActiveTab(tKey);
    else if (setTab) setTab(tKey);
  };

  const totalReqCount = requestsCount ?? pendingRequestsCount ?? 0;

  const tabs = [
    { key: "requests" as HireTab, label: "Requisitions", icon: "ri-file-list-3-line", count: totalReqCount, isBadge: true },
    { key: "jobs" as HireTab, label: "Job Openings", icon: "ri-briefcase-line", count: jobsCount },
    { key: "candidates" as HireTab, label: "Candidates", icon: "ri-user-search-line", count: candidatesCount },
    { key: "interviews" as HireTab, label: "Interviews", icon: "ri-calendar-todo-line", count: interviewsCount },
    { key: "pipeline" as HireTab, label: "Hiring Pipeline", icon: "ri-kanban-view", count: null },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80 mb-6 overflow-x-auto no-scrollbar pb-px">
      {tabs.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => handleSelectTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <i className={`${t.icon} text-base`} />
            <span>{t.label}</span>
            {t.count !== null && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
