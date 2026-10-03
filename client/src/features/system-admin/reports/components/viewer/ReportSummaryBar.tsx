import { memo } from "react";

interface ReportSummaryBarProps {
  summary: Record<string, string | number>;
}

export const ReportSummaryBar = memo(function ReportSummaryBar({
  summary,
}: ReportSummaryBarProps) {
  const entries = Object.entries(summary);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {entries.map(([k, v]) => (
        <div key={k} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xs">
          <p className="text-xs text-gray-500">{k}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{v}</p>
        </div>
      ))}
    </div>
  );
});
