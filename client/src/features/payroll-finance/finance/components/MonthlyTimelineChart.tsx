import { memo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import type { MonthlyTimelineItem } from "../types";

interface MonthlyTimelineChartProps {
  monthlyTimelineData: MonthlyTimelineItem[];
}

export const MonthlyTimelineChart = memo(function MonthlyTimelineChart({
  monthlyTimelineData,
}: MonthlyTimelineChartProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
        <i className="ri-line-chart-line text-[#253C7D]" />
        Monthly Cashflow Trend ($k)
      </h3>
      <p className="text-xs text-gray-400 mb-3">Historical expense volume over time</p>

      {monthlyTimelineData.length > 0 ? (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTimelineData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#253C7D" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#253C7D"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total ($k)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-60 flex flex-col items-center justify-center text-gray-400 text-xs">
          <i className="ri-line-chart-line text-3xl mb-2 text-gray-300" />
          No historical timeline data
        </div>
      )}
    </div>
  );
});
