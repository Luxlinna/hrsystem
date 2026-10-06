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
}: LeaveTabsBarProps) {
  const tabs = [
    { key: "requests" as const, label: "Leave Requests", icon: "ri-file-list-3-line", count: pendingCount },
    { key: "balances" as const, label: "Balances & Entitlements", icon: "ri-pie-chart-line", count: null },
    { key: "calendar" as const, label: "Leave Calendar", icon: "ri-calendar-event-line", count: onLeaveTodayCount > 0 ? onLeaveTodayCount : null },
  ];

  const activeObj = tabs.find((t) => t.key === activeTab);

  return (
    <div className="border-b border-slate-200/80">
      {/* Mobile Filter Dropdown */}
      <div className="sm:hidden w-full pb-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#253C7D]">
            <i className={`${activeObj?.icon || "ri-filter-3-line"} text-sm`} />
          </div>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as "requests" | "balances" | "calendar")}
            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 shadow-2xs appearance-none focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {tabs.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label} {t.count !== null && t.count > 0 ? `(${t.count})` : ""}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <i className="ri-arrow-down-s-line text-sm" />
          </div>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:flex items-center gap-1 sm:gap-2 min-w-max overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
                isActive
                  ? "border-[#253C7D] text-[#253C7D]"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <i className={`${t.icon} text-sm ${isActive ? "text-[#253C7D]" : "text-slate-400"}`} />
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
