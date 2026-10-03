import { memo } from "react";

interface ReportSummaryBarProps {
  summary: Record<string, string | number>;
}

function getMetricIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("total") || k.includes("headcount")) return "ri-stack-line text-blue-500";
  if (k.includes("hour") || k.includes("time") || k.includes("duration")) return "ri-time-line text-indigo-500";
  if (k.includes("staff") || k.includes("employee") || k.includes("assigned")) return "ri-user-follow-line text-emerald-500";
  if (k.includes("open") || k.includes("needs") || k.includes("pending")) return "ri-user-unfollow-line text-amber-500";
  if (k.includes("coverage") || k.includes("rate") || k.includes("%") || k.includes("punctual")) return "ri-pie-chart-line text-purple-500";
  if (k.includes("pay") || k.includes("salary") || k.includes("cost") || k.includes("amount") || k.includes("expense")) return "ri-money-dollar-circle-line text-teal-500";
  if (k.includes("deleted") || k.includes("rejected")) return "ri-delete-bin-line text-rose-500";
  return "ri-bar-chart-line text-slate-500";
}

export const ReportSummaryBar = memo(function ReportSummaryBar({
  summary,
}: ReportSummaryBarProps) {
  const entries = Object.entries(summary);
  if (entries.length === 0) return null;

  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-1 sm:grid-cols-3";
    if (count === 4) return "grid-cols-2 sm:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
  };

  return (
    <div className={`grid ${getGridCols(entries.length)} gap-3 mb-4`}>
      {entries.map(([k, v]) => {
        const isDel = k.toLowerCase().includes("deleted");
        const isOpenSlot = k.toLowerCase().includes("open");
        const iconClass = getMetricIcon(k);

        return (
          <div
            key={k}
            className={`bg-white border rounded-xl p-3.5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 ${
              isDel
                ? "border-rose-200 bg-rose-50/20"
                : isOpenSlot
                ? "border-amber-200 bg-amber-50/10"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {k}
              </span>
              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                <i className={`${iconClass} text-xs`} />
              </div>
            </div>
            <p className={`text-xl font-bold tracking-tight mt-1.5 ${
              isDel ? "text-rose-600" : isOpenSlot ? "text-amber-700" : "text-slate-900"
            }`}>
              {v}
            </p>
          </div>
        );
      })}
    </div>
  );
});
