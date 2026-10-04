import { memo } from "react";
import { Link } from "react-router-dom";
import type { LiveStats } from "../types";

interface DashboardKpiGridProps {
  stats: LiveStats;
  can: (module: string) => boolean;
}

export const DashboardKpiGrid = memo(function DashboardKpiGrid({
  stats,
  can,
}: DashboardKpiGridProps) {
  const kpis = [
    { label: "Total Staff", value: stats.employees.toLocaleString(), icon: "ri-group-line", link: "/employees", module: "employees" },
    { label: "Active Today", value: stats.activeEmployees.toLocaleString(), icon: "ri-user-follow-line", link: "/employees", module: "employees" },
    { label: "Open Roles", value: stats.openJobs.toString(), icon: "ri-briefcase-line", link: "/hire", module: "hire" },
    { label: "Pending Leave", value: stats.leavePending.toString(), icon: "ri-calendar-event-line", link: "/leave", module: "leave" },
    { label: "Onboarding", value: stats.onboardingPending.toString(), icon: "ri-user-add-line", link: "/onboarding", module: "onboarding" },
    { label: "Candidates", value: stats.totalCandidates.toString(), icon: "ri-team-line", link: "/hire", module: "hire" },
  ].filter((s) => can(s.module));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 mb-5">
      {kpis.map((s) => (
        <Link
          key={s.label}
          to={s.link}
          className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate pr-1">
              {s.label}
            </span>
            <i className={`${s.icon} text-slate-400 group-hover:text-slate-700 text-sm transition-colors`} />
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 tabular-nums">
            {s.value}
          </p>
        </Link>
      ))}
    </div>
  );
});
