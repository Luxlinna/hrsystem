import { memo } from "react";

interface LeaveTabsBarProps {
  activeTab: "requests" | "balances" | "calendar";
  setActiveTab: (tab: "requests" | "balances" | "calendar") => void;
  pendingCount: number;
  onLeaveTodayCount: number;
}

export const LeaveTabsBar = memo(function LeaveTabsBar({
  activeTab,
  setActiveTab,
  pendingCount,
  onLeaveTodayCount,
}: LeaveTabsBarProps) {
  const tabs = [
    { key: "requests" as const, label: "Leave Requests", icon: "ri-file-list-3-line", count: pendingCount },
    { key: "balances" as const, label: "Balances & Entitlements", icon: "ri-pie-chart-line", count: null },
    { key: "calendar" as const, label: "Leave Calendar", icon: "ri-calendar-event-line", count: onLeaveTodayCount > 0 ? onLeaveTodayCount : null },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80 overflow-x-auto no-scrollbar pb-px">
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
            {t.count !== null && t.count > 0 && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isActive ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-amber-100 text-amber-800"
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
