import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PIPELINE_STAGES, STAGE_CONFIG } from "../../constants";

interface PipelineMetricsChartProps {
  stageCounts: Record<string, number>;
}

export const PipelineMetricsChart = memo(function PipelineMetricsChart({
  stageCounts,
}: PipelineMetricsChartProps) {
  const chartData = PIPELINE_STAGES.map((st) => ({
    stage: STAGE_CONFIG[st]?.label || st,
    count: stageCounts[st] || 0,
    fill: STAGE_CONFIG[st]?.hex || "#253C7D",
  }));

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
        <i className="ri-bar-chart-grouped-line text-[#253C7D]" />
        Applicant Distribution by Stage
      </h3>
      <p className="text-xs text-gray-400 mb-4">Volume of talent moving through recruitment funnel</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={45}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
