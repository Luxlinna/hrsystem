import { memo } from "react";

interface MetricCardsProps {
  totalEmployees: number;
  activeEmployees: number;
  avgTenure: string;
  openJobsCount: number;
  candidatesCount: number;
  pendingLeaveCount: number;
  activeOffboardingCount: number;
  openTickets: number;
  assignedAssets: number;
  totalAssets: number;
  totalExpense: number;
}

export const MetricCards = memo(function MetricCards({
  totalEmployees,
  activeEmployees,
  avgTenure,
  openJobsCount,
  candidatesCount,
  pendingLeaveCount,
  activeOffboardingCount,
  openTickets,
  assignedAssets,
  totalAssets,
  totalExpense,
}: MetricCardsProps) {
  const stats = [
    { label: "Employees", value: totalEmployees, sub: `${activeEmployees} active`, color: "bg-[#253C7D]/10 text-[#253C7D]" },
    { label: "Avg Tenure", value: `${avgTenure}yr`, sub: "", color: "bg-emerald-50 text-emerald-700" },
    { label: "Open Roles", value: openJobsCount, sub: `${candidatesCount} candidates`, color: "bg-amber-50 text-amber-700" },
    { label: "Pending Leave", value: pendingLeaveCount, sub: "", color: "bg-sky-50 text-sky-700" },
    { label: "Offboarding", value: activeOffboardingCount, sub: "active", color: "bg-rose-50 text-rose-700" },
    { label: "IT Tickets", value: openTickets, sub: "open", color: "bg-violet-50 text-violet-700" },
    { label: "Assets", value: `${assignedAssets}/${totalAssets}`, sub: "assigned", color: "bg-teal-50 text-teal-700" },
    { label: "Expenses", value: `$${Math.round(totalExpense / 1000)}k`, sub: "total", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
          <p className="text-lg font-bold">{s.value}</p>
          <p className="text-[10px] font-semibold mt-0.5 leading-tight">{s.label}</p>
          {s.sub && <p className="text-[9px] mt-0.5 opacity-70">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
});
