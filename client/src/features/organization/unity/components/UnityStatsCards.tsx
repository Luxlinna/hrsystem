import { memo } from "react";

interface UnityStatsCardsProps {
  activeApps: number;
  totalUsers: number;
  todayEvents: number;
  totalMonthlyCost: number;
}

export const UnityStatsCards = memo(function UnityStatsCards({
  activeApps,
  totalUsers,
  todayEvents,
  totalMonthlyCost,
}: UnityStatsCardsProps) {
  const stats = [
    { label: "Active Apps", value: activeApps, icon: "ri-apps-line", color: "text-[#253C7D] bg-[#253C7D]/10" },
    { label: "Total Users", value: totalUsers, icon: "ri-user-line", color: "text-emerald-700 bg-emerald-50" },
    { label: "Today Events", value: todayEvents, icon: "ri-pulse-line", color: "text-amber-700 bg-amber-50" },
    {
      label: "Monthly Cost",
      value: `$${(totalMonthlyCost / 1000).toFixed(1)}k`,
      icon: "ri-money-dollar-circle-line",
      color: "text-rose-700 bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="border border-gray-100 rounded-xl p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
            <i className={`${s.icon} w-5 h-5 flex items-center justify-center`} />
          </div>
          <div>
            <p className="text-[18px] font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
});
