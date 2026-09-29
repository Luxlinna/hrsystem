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
    <section className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 pt-5 pb-5">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
              <span>WORKSPACE</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">EXECUTIVE DASHBOARD</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 rounded-full ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              {greeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
              Workforce overview across {stats.branches} {stats.branches === 1 ? "branch" : "branches"} &middot; updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-2xs active:scale-98"
            >
              <i className={`ri-refresh-line text-sm ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Updating..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Executive summary strip */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3.5 max-w-xl">
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 sm:p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Branches</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{stats.branches}</p>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 sm:p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Staff</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{stats.activeEmployees}</p>
          </div>
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-2.5 sm:p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Alerts</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{stats.notificationsUnread}</p>
          </div>
        </div>
      </div>
    </section>
  );
});
