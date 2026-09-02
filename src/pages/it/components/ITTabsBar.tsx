import { memo } from "react";
import type { ITTabType } from "../types";

interface ITTabsBarProps {
  activeTab: ITTabType;
  setActiveTab: (tab: ITTabType) => void;
  assetsCount: number;
  openTicketsCount: number;
  stationeryItemsCount?: number;
  pendingRequestsCount?: number;
}

export const ITTabsBar = memo(function ITTabsBar({
  activeTab,
  setActiveTab,
  assetsCount,
  openTicketsCount,
  stationeryItemsCount,
  pendingRequestsCount = 0,
}: ITTabsBarProps) {
  const tabs = [
    { key: "assets" as const, label: "Hardware & Asset Register", icon: "ri-macbook-line", count: assetsCount },
    { key: "tickets" as const, label: "Helpdesk & Incident Queue", icon: "ri-customer-service-2-line", count: openTicketsCount },
    {
      key: "stationery" as const,
      label: "Stationery & Supplies",
      icon: "ri-box-3-line",
      count: stationeryItemsCount != null ? stationeryItemsCount : null,
      badgeExtra: pendingRequestsCount > 0 ? `${pendingRequestsCount} req` : null,
    },
    { key: "security" as const, label: "Enterprise Security & Access", icon: "ri-shield-check-line", count: null },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80 mb-6 overflow-x-auto no-scrollbar pb-px">
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
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
            {t.badgeExtra && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                {t.badgeExtra}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
