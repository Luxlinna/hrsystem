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

  return (
    <div>
      {/* Mobile View: Compact Dropdown Switcher */}
      <div className="sm:hidden">
        <div className="relative">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as "requests" | "balances" | "calendar")}
            className="w-full appearance-none bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 pr-9 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] shadow-2xs cursor-pointer"
          >
            {tabs.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label} {t.count !== null && t.count > 0 ? `(${t.count})` : ""}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none" />
        </div>
      </div>

      {/* Desktop / Tablet View: Tab Strip */}
      <div className="hidden sm:flex items-center gap-1 sm:gap-2 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
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
