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
    { label: "Total Employees", value: stats.employees.toLocaleString(), icon: "ri-user-3-line", accent: "#253C7D", link: "/employees", module: "employees" },
    { label: "Active Now", value: stats.activeEmployees.toLocaleString(), icon: "ri-user-follow-line", accent: "#059669", link: "/employees", module: "employees" },
    { label: "Open Roles", value: stats.openJobs.toString(), icon: "ri-briefcase-line", accent: "#2563EB", link: "/hire", module: "hire" },
    { label: "Pending Leaves", value: stats.leavePending.toString(), icon: "ri-time-line", accent: "#D97706", link: "/leave", module: "leave" },
    { label: "Onboarding", value: stats.onboardingPending.toString(), icon: "ri-user-add-line", accent: "#7C3AED", link: "/onboarding", module: "onboarding" },
    { label: "Candidates", value: stats.totalCandidates.toString(), icon: "ri-team-line", accent: "#E11D48", link: "/hire", module: "hire" },
  ].filter((s) => can(s.module));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
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
              style={{ backgroundColor: `${s.accent}15`, color: s.accent }}
            >
              <i className={`${s.icon} text-sm`} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-gray-900 mt-2 tracking-tight">
            {s.value}
          </p>
        </Link>
      ))}
    </div>
  );
});
