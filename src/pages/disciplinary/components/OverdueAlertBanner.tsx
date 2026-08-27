import { memo } from "react";

interface OverdueAlertBannerProps {
  canManage: boolean;
  overdueCount: number;
  onReviewOverdue: () => void;
}

export const OverdueAlertBanner = memo(function OverdueAlertBanner({
  canManage,
  overdueCount,
  onReviewOverdue,
}: OverdueAlertBannerProps) {
  if (!canManage || overdueCount === 0) return null;

  return (
    <div
      onClick={onReviewOverdue}
      className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-rose-100/70 transition-colors group"
    >
      <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse">
        <i className="ri-alarm-warning-line text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-rose-700">
          {overdueCount} Case{overdueCount > 1 ? "s" : ""} Have Overdue Follow-Up Dates
        </p>
        <p className="text-[11px] text-rose-600/80 mt-0.5">
          Immediate action required &mdash; these cases passed their follow-up milestone without resolution.
        </p>
      </div>
      <span className="text-[11px] font-bold text-rose-600 group-hover:text-rose-800 transition-colors whitespace-nowrap flex items-center gap-1">
        Review now <i className="ri-arrow-right-line" />
      </span>
    </div>
  );
});
