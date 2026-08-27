import { memo } from "react";
import type { DisciplinaryTabKey } from "../types";

interface NavigationTabsProps {
  activeTab: DisciplinaryTabKey;
  onSelectTab: (tab: DisciplinaryTabKey) => void;
  totalCount: number;
  openCount: number;
  pipCount: number;
  criticalCount: number;
  resolvedCount: number;
}

export const NavigationTabs = memo(function NavigationTabs({
  activeTab,
  onSelectTab,
  totalCount,
  openCount,
  pipCount,
  criticalCount,
  resolvedCount,
}: NavigationTabsProps) {
  const tabs = [
    { id: "all" as const, label: "All Cases", count: totalCount, icon: "ri-folder-line" },
    { id: "open" as const, label: "Open & Active", count: openCount, icon: "ri-time-line", isAlert: openCount > 0 },
    { id: "pip" as const, label: "Performance Plans (PIPs)", count: pipCount, icon: "ri-focus-3-line" },
    { id: "critical" as const, label: "High / Critical Alerts", count: criticalCount, icon: "ri-fire-line", isAlert: criticalCount > 0 },
    { id: "resolved" as const, label: "Resolved & Closed", count: resolvedCount, icon: "ri-checkbox-circle-line" },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 mb-5 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-[#253C7D] text-white shadow-xs"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/60 hover:bg-gray-50"
            }`}
          >
            <i className={tab.icon} />
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                isActive
                  ? "bg-white/20 text-white"
                  : tab.isAlert
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
});
