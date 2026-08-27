import { memo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { AttendanceBucket, HiringTrendItem } from "../types";
import { pieColors } from "../constants";

interface AnalyticsChartsSectionProps {
  showAnalyticsCharts: boolean;
  attendanceData: AttendanceBucket[];
  deptData: Record<string, number>;
  hiringTrend: HiringTrendItem[];
}

export const AnalyticsChartsSection = memo(function AnalyticsChartsSection({
  showAnalyticsCharts,
  attendanceData,
  deptData,
  hiringTrend,
}: AnalyticsChartsSectionProps) {
  if (!showAnalyticsCharts) return null;

  const pieData = Object.entries(deptData ?? {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 mb-6">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Analytics Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Attendance Overview */}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">
            Weekly Attendance Overview
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#253C7D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="present" stroke="#253C7D" fill="url(#colorPresent)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent" stroke="#E11D48" fill="url(#colorAbsent)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">
            Department Distribution
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                <span className="text-[11px] text-gray-600">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring vs Termination Trend */}
        <div className="border border-gray-100 rounded-xl p-4 lg:col-span-2">
          <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-3">
            Hiring vs Termination Trend
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="hires" fill="#253C7D" radius={[4, 4, 0, 0]} name="Hires" />
                <Bar dataKey="terminations" fill="#E11D48" radius={[4, 4, 0, 0]} name="Terminations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});
