interface StatsBarProps {
  kpiTotalShiftsThisWeek: number;
  kpiCoveragePercentage: number;
  kpiTotalOpenSpots: number;
  kpiTotalWeeklyAssigned: number;
  kpiTotalWeeklyCapacity: number;
  kpiTotalWeeklyHours: number;
  totalShiftsCount: number;
  branchesCount: number;
}

export function ShiftStatsBar({
  kpiTotalShiftsThisWeek,
  kpiCoveragePercentage,
  kpiTotalOpenSpots,
  kpiTotalWeeklyAssigned,
  kpiTotalWeeklyCapacity,
  kpiTotalWeeklyHours,
  totalShiftsCount,
  branchesCount,
}: StatsBarProps) {
  const stats = [
    {
      label: "Weekly Shifts",
      value: kpiTotalShiftsThisWeek,
      subtext: `${totalShiftsCount} total shifts in system`,
      icon: "ri-time-line",
      color: "text-[#253C7D]",
    },
    {
      label: "Staffing Coverage",
      value: `${kpiCoveragePercentage}%`,
      subtext: `${kpiTotalWeeklyAssigned}/${kpiTotalWeeklyCapacity} slots staffed`,
      icon: "ri-user-follow-line",
      color: "text-emerald-600",
    },
    {
      label: "Open Slots",
      value: kpiTotalOpenSpots,
      subtext: kpiTotalOpenSpots > 0 ? `${kpiTotalOpenSpots} understaffed` : "All filled",
      icon: "ri-user-add-line",
      color: kpiTotalOpenSpots > 0 ? "text-amber-600" : "text-emerald-600",
    },
    {
      label: "Scheduled Hours",
      value: `${kpiTotalWeeklyHours} hrs`,
      subtext: `Across ${branchesCount} branches`,
      icon: "ri-calendar-check-line",
      color: "text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <i className={`${s.icon} ${s.color} text-xl`} />
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{s.subtext}</p>
        </div>
      ))}
    </div>
  );
}
