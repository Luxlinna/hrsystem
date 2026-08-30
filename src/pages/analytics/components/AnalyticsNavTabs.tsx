import { memo } from "react";
import type { AnalyticsTabKey } from "../types";
import { TABS } from "../constants";

interface AnalyticsNavTabsProps {
  activeTab: AnalyticsTabKey;
  setActiveTab: (tab: AnalyticsTabKey) => void;
}

export const AnalyticsNavTabs = memo(function AnalyticsNavTabs({
  activeTab,
  setActiveTab,
}: AnalyticsNavTabsProps) {
  return (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setActiveTab(t.key)}
          className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === t.key ? "bg-white text-[#253C7D]" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
});
