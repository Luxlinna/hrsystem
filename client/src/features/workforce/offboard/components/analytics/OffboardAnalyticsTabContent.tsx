import { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  Cell,
  type PieLabelRenderProps,
} from "recharts";

interface OffboardAnalyticsTabContentProps {
  reasonChartData: { name: string; value: number; fill: string }[];
  deptChartData: { department: string; count: number }[];
}

export const OffboardAnalyticsTabContent = memo(function OffboardAnalyticsTabContent({
  reasonChartData,
  deptChartData,
}: OffboardAnalyticsTabContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Reasons for Departure */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-gray-900">Reasons for Departure</h3>
          <p className="text-xs text-gray-400 mt-0.5">Primary exit factors across all recorded departures</p>
        </div>

        {reasonChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-gray-400">
            No departure data available for visualization.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry: any) =>
                    `${entry.name || ""}: ${entry.value || 0}`
                  }
                  labelLine={false}
                >
                  {reasonChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart 2: Departures by Department */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-gray-900">Departures by Department</h3>
          <p className="text-xs text-gray-400 mt-0.5">Turnover distribution across company departments</p>
        </div>

        {deptChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-gray-400">
            No department data available for visualization.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "12px",
                    border: "none",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#253C7D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});
