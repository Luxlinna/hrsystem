import { memo } from "react";
import type { ComplaintStats } from "../types";

interface ComplaintStatsRowProps {
  stats: ComplaintStats;
}

const Card = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex items-center gap-4">
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}15` }}
    >
      <i className={`${icon} text-xl`} style={{ color }} />
    </div>
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

export const ComplaintStatsRow = memo(function ComplaintStatsRow({
  stats,
}: ComplaintStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card label="Total Records" value={stats.total} icon="ri-folder-shared-line" color="#253C7D" />
      <Card label="Pending Review" value={stats.pending} icon="ri-time-line" color="#D97706" />
      <Card label="Under Review" value={stats.inReview} icon="ri-search-eye-line" color="#2563EB" />
      <Card label="Resolved" value={stats.resolved} icon="ri-checkbox-circle-line" color="#059669" />
    </div>
  );
});
