import { memo } from "react";
import type { LiveStats } from "../types";

interface DashboardHeroProps {
  displayName: string;
  stats: LiveStats;
  lastUpdated: Date;
  refreshing: boolean;
  onRefresh: () => void;
}

export const DashboardHero = memo(function DashboardHero({
  displayName,
  stats,
  lastUpdated,
  refreshing,
  onRefresh,
}: DashboardHeroProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section className="relative bg-gradient-to-br from-[#253C7D] via-[#2E5AA8] to-[#29ABE2] text-white">
      <div className="px-4 sm:px-6 lg:px-10 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">
              <span>Workspace</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-white font-bold">Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2.5 flex-wrap">
              {greeting}, {displayName}
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-100 bg-emerald-400/20 border border-emerald-300/30 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Live
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-white/70 mt-1.5">
              Real-time workforce overview across {stats.branches} {stats.branches === 1 ? "branch" : "branches"} &middot; updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl backdrop-blur-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <i className={`ri-refresh-line text-sm ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-8 mt-7">
          <div>
            <p className="text-xl sm:text-2xl font-bold">{stats.branches}</p>
            <p className="text-[11px] text-white/70 mt-0.5">Active Branches</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold">{stats.activeEmployees}</p>
            <p className="text-[11px] text-white/70 mt-0.5">Active Employees</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold">{stats.notificationsUnread}</p>
            <p className="text-[11px] text-white/70 mt-0.5">Alerts</p>
          </div>
        </div>
      </div>
    </section>
  );
});
