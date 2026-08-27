import { memo } from "react";
import { Link } from "react-router-dom";
import type { HrKpiState } from "../types";

interface HrAnalyticsKpiSectionProps {
  hrKpis: HrKpiState;
  showHrInsights: boolean;
  can: (module: string) => boolean;
}

export const HrAnalyticsKpiSection = memo(function HrAnalyticsKpiSection({
  hrKpis,
  showHrInsights,
  can,
}: HrAnalyticsKpiSectionProps) {
  if (!showHrInsights) return null;

  const kpis = [
    { label: "Attendance Rate", value: `${hrKpis.attendanceRate}%`, icon: "ri-user-follow-line", color: "text-emerald-600", bg: "bg-emerald-50", link: "/attendance", module: "attendance", note: "Last 7 days" },
    { label: "Avg Hours/Day", value: `${hrKpis.avgHoursWorked}h`, icon: "ri-timer-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", link: "/attendance", module: "attendance", note: "Per employee" },
    { label: "Late Arrival Rate", value: `${hrKpis.lateRate}%`, icon: "ri-time-line", color: hrKpis.lateRate > 15 ? "text-rose-600" : "text-amber-600", bg: hrKpis.lateRate > 15 ? "bg-rose-50" : "bg-amber-50", link: "/attendance", module: "attendance", note: "Of check-ins" },
    { label: "Training Completion", value: `${hrKpis.trainingCompletionRate}%`, icon: "ri-graduation-cap-line", color: "text-violet-600", bg: "bg-violet-50", link: "/training", module: "training", note: "All enrollments" },
    { label: "Active Trainings", value: hrKpis.inProgressTrainings.toString(), icon: "ri-book-open-line", color: "text-sky-600", bg: "bg-sky-50", link: "/training", module: "training", note: "In progress" },
    { label: "Open Cases", value: hrKpis.openDisciplinaryCases.toString(), icon: "ri-alert-line", color: hrKpis.openDisciplinaryCases > 3 ? "text-rose-600" : "text-orange-600", bg: hrKpis.openDisciplinaryCases > 3 ? "bg-rose-50" : "bg-orange-50", link: "/disciplinary", module: "disciplinary", note: "Disciplinary" },
  ].filter((kpi) => can(kpi.module));

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">HR Analytics KPIs</h2>
        <span className="text-[11px] text-gray-400">Last 7 days</span>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.link}
            className="border border-gray-100 rounded-xl p-3.5 hover:border-[#253C7D]/20 transition-all group"
          >
            <div className={`w-7 h-7 flex items-center justify-center rounded-lg mb-2 ${kpi.bg}`}>
              <i className={`${kpi.icon} ${kpi.color} text-sm`} />
            </div>
            <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] font-semibold text-gray-700 mt-0.5 leading-tight">{kpi.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{kpi.note}</p>
          </Link>
        ))}
      </div>

      {/* Attendance Trend Sparkline */}
      {can("attendance") && (
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
              7-Day Attendance Trend
            </h3>
            <Link to="/attendance" className="text-[11px] text-[#253C7D] font-semibold hover:underline">
              Full Report
            </Link>
          </div>
          <div className="flex items-end gap-2 h-20">
            {hrKpis.attendanceTrend.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      d.rate >= 85 ? "bg-emerald-400" : d.rate >= 70 ? "bg-amber-400" : "bg-rose-400"
                    }`}
                    style={{ height: `${Math.max(8, d.rate * 0.56)}px` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">{d.day}</span>
                <span
                  className={`text-[10px] font-bold ${
                    d.rate >= 85 ? "text-emerald-600" : d.rate >= 70 ? "text-amber-600" : "text-rose-500"
                  }`}
                >
                  {d.rate > 0 ? `${d.rate}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
