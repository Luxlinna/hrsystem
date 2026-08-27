import { memo } from "react";
import { Link } from "react-router-dom";
import type { LiveStats } from "../types";

interface DashboardKpiGridProps {
  stats: LiveStats;
  can: (module: string) => boolean;
  currentMonthLabel: string;
}

export const DashboardKpiGrid = memo(function DashboardKpiGrid({
  stats,
  can,
  currentMonthLabel,
}: DashboardKpiGridProps) {
  const kpis = [
    { label: "Total Employees", value: stats.employees.toLocaleString(), icon: "ri-user-3-line", accent: "#253C7D", link: "/employees", module: "employees" },
    { label: "Active Now", value: stats.activeEmployees.toLocaleString(), icon: "ri-user-follow-line", accent: "#059669", link: "/employees", module: "employees" },
    { label: "Open Roles", value: stats.openJobs.toString(), icon: "ri-briefcase-line", accent: "#2563EB", link: "/hire", module: "hire" },
    { label: "Pending Leaves", value: stats.leavePending.toString(), icon: "ri-time-line", accent: "#D97706", link: "/leave", module: "leave" },
    { label: "Onboarding", value: stats.onboardingPending.toString(), icon: "ri-user-add-line", accent: "#7C3AED", link: "/onboarding", module: "onboarding" },
    { label: "Candidates", value: stats.totalCandidates.toString(), icon: "ri-team-line", accent: "#E11D48", link: "/hire", module: "hire" },
    { label: `Payroll (${currentMonthLabel.slice(0, 3)})`, value: `$${(stats.payrollTotal / 1000).toFixed(1)}k`, icon: "ri-money-dollar-circle-line", accent: "#0D9488", link: "/payroll-module", module: "payroll" },
    { label: "Processed", value: `${stats.payrollProcessed}`, icon: "ri-check-double-line", accent: "#16A34A", link: "/payroll-module", module: "payroll" },
  ].filter((s) => can(s.module));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {kpis.map((s) => (
        <Link
          key={s.label}
          to={s.link}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate pr-2">
              {s.label}
            </span>
            <div
              className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${s.accent}14`, color: s.accent }}
            >
              <i className={`${s.icon} text-sm`} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-2 group-hover:text-[#253C7D] transition-colors">
            {s.value}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: s.accent }} />
        </Link>
      ))}
    </div>
  );
});
