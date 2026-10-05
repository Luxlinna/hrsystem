import { memo, useRef, useState, useEffect, useMemo } from "react";
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
  actionsCount?: number;
  offersCount?: number;
  isHrDivisionScope?: boolean;
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
  actionsCount = 0,
  offersCount = 0,
  isHrDivisionScope = true,
}: HireTabsBarProps) {
  const currentTab = activeTab || tab || "requests";
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  const handleSelectTab = (tKey: HireTab) => {
    if (setActiveTab) setActiveTab(tKey);
    else if (setTab) setTab(tKey);
  };

  const totalReqCount = requestsCount ?? pendingRequestsCount ?? 0;

  const tabs: Array<{
    key: HireTab;
    label: string;
    icon: string;
    count: number | null;
    isBadge?: boolean;
    highlight?: boolean;
  }> = useMemo(
    () => [
      ...(isHrDivisionScope
        ? [
            {
              key: "actions" as HireTab,
              label: "My Recruitment Actions",
              icon: "ri-checkbox-circle-line",
              count: actionsCount,
              isBadge: true,
              highlight: true,
            },
          ]
        : []),
      { key: "requests" as HireTab, label: "Requisitions", icon: "ri-file-list-3-line", count: totalReqCount, isBadge: true },
      { key: "jobs" as HireTab, label: "Job Openings", icon: "ri-briefcase-line", count: jobsCount },
      { key: "candidates" as HireTab, label: "Candidates", icon: "ri-user-search-line", count: candidatesCount },
      { key: "interviews" as HireTab, label: "Interviews", icon: "ri-calendar-todo-line", count: interviewsCount },
      { key: "offers" as HireTab, label: "Offer Letters", icon: "ri-mail-check-line", count: offersCount, isBadge: true },
      { key: "pipeline" as HireTab, label: "Hiring Pipeline", icon: "ri-kanban-view", count: null },
    ],
    [isHrDivisionScope, actionsCount, totalReqCount, jobsCount, candidatesCount, interviewsCount, offersCount]
  );

  useEffect(() => {
    const el = tabButtonRefs.current.get(currentTab);
    if (el) {
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    }
  }, [currentTab, tabs]);

  return (
    <div
      ref={tabsContainerRef}
      className="relative flex items-center gap-1 border-b border-gray-200/80 mb-6 overflow-x-auto no-scrollbar pb-px"
    >
      {/* Sliding PowerPoint-style active indicator bar */}
      {indicator.ready && (
        <div
          className="absolute bottom-0 h-[2.5px] bg-[#253C7D] rounded-full pointer-events-none shadow-xs"
          style={{
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
            transition: "left 500ms cubic-bezier(0.22, 1, 0.36, 1), width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      )}

      {tabs.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <button
            key={t.key}
            ref={(el) => {
              if (el) tabButtonRefs.current.set(t.key, el);
              else tabButtonRefs.current.delete(t.key);
            }}
            type="button"
            onClick={() => handleSelectTab(t.key)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
              isActive
                ? "text-[#253C7D]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className={`${t.icon} text-base`} />
            <span>{t.label}</span>
            {t.count !== null && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
                  t.highlight && t.count > 0
                    ? isActive
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : isActive
                    ? "bg-[#253C7D]/10 text-[#253C7D]"
                    : "bg-gray-100 text-gray-600"
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
