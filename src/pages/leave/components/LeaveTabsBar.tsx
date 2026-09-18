import { memo } from "react";

interface LeaveTabsBarProps {
  activeTab: "requests" | "balances" | "calendar";
  setActiveTab: (tab: "requests" | "balances" | "calendar") => void;
  pendingCount: number;
  onLeaveTodayCount: number;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
}

export const LeaveTabsBar = memo(function LeaveTabsBar({
  activeTab,
  setActiveTab,
  pendingCount,
  onLeaveTodayCount,
  onOpenHolidaysModal,
  holidayCount,
}: LeaveTabsBarProps) {
  const tabs = [
    { key: "requests" as const, label: "Leave Requests", icon: "ri-file-list-3-line", count: pendingCount },
    { key: "balances" as const, label: "Balances & Entitlements", icon: "ri-pie-chart-line", count: null },
    { key: "calendar" as const, label: "Leave Calendar", icon: "ri-calendar-event-line", count: onLeaveTodayCount > 0 ? onLeaveTodayCount : null },
  ];

  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 overflow-x-auto no-scrollbar pb-px">
      <div className="flex items-center gap-2">
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

      {onOpenHolidaysModal && (
        <button
          type="button"
          onClick={onOpenHolidaysModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap mb-1"
          title="Cambodia Labor Law Public Holidays Calendar"
        >
          <i className="ri-calendar-event-line text-sm text-purple-600" />
          <span>Public Holidays</span>
          {holidayCount !== undefined && holidayCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-200 text-purple-800 font-black">
              {holidayCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
});
