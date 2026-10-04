import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { CompensationChartItem, DeptDistributionItem } from "../types";

interface PayrollChartsSectionProps {
  chartData: CompensationChartItem[];
  deptDistributionData: DeptDistributionItem[];
  isDark: boolean;
}

export const PayrollChartsSection = memo(function PayrollChartsSection({
  chartData,
  deptDistributionData,
  isDark,
}: PayrollChartsSectionProps) {
  if (chartData.length === 0 && deptDistributionData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      {/* Compensation Distribution Bar Chart */}
      <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
              Compensation Breakdown (in $k)
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              Comparison of base salary, additions, deductions, and net payout
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-[#253C7D] dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-[#253C7D] dark:bg-sky-400" /> Base
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bonus
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Deduct
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#f1f5f9"} />
              <XAxis
                dataKey="name"
                stroke={isDark ? "#94a3b8" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke={isDark ? "#94a3b8" : "#94a3b8"}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#1e293b",
                  borderColor: isDark ? "#334155" : "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
              <Bar dataKey="base" fill={isDark ? "#5B7FD1" : "#253C7D"} radius={[4, 4, 0, 0]} name="Base Salary" />
              <Bar dataKey="bonus" fill="#10b981" radius={[4, 4, 0, 0]} name="Bonus" />
              <Bar dataKey="deductions" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Deductions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown Donut */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Payout by Department
          </h3>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            Net compensation allocation
          </p>
        </div>

        <div className="h-56 w-full relative my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {deptDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Net Pay"]}
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#1e293b",
                  borderColor: isDark ? "#334155" : "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "11px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(val) => (
                  <span style={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "11px", fontWeight: 600 }}>
                    {val}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="text-[10px] text-gray-400 dark:text-slate-500 text-center border-t border-gray-100 dark:border-slate-800 pt-2">
          Aggregated across active filter parameters
        </div>
      </div>
    </div>
  );
});
