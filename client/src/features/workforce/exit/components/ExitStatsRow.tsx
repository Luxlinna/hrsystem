import { memo } from "react";

interface ExitStatsRowProps {
  total: number;
  thisMonth: number;
  resignations: number;
  terminations: number;
}

const Card = ({
  label, value, icon, color, sub,
}: { label: string; value: number; icon: string; color: string; sub?: string }) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 flex items-center gap-4">
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18` }}
    >
      <i className={`${icon} text-xl`} style={{ color }} />
    </div>
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const ExitStatsRow = memo(function ExitStatsRow({
  total, thisMonth, resignations, terminations,
}: ExitStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card label="Total Exits"     value={total}        icon="ri-logout-box-r-line"  color="#253C7D" />
      <Card label="This Month"      value={thisMonth}    icon="ri-calendar-event-line" color="#D97706" sub="exits recorded" />
      <Card label="Resignations"    value={resignations} icon="ri-user-unfollow-line"  color="#7C3AED" />
      <Card label="Terminations"    value={terminations} icon="ri-forbid-2-line"       color="#DC2626" />
    </div>
  );
});
