import { memo } from "react";

interface PayrollApprovalPendingBannerProps {
  pendingCount: number;
  onReviewNow: () => void;
}

export const PayrollApprovalPendingBanner = memo(function PayrollApprovalPendingBanner({
  pendingCount,
  onReviewNow,
}: PayrollApprovalPendingBannerProps) {
  if (pendingCount === 0) return null;

  return (
    <div
      onClick={onReviewNow}
      className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-amber-100/70 transition-colors group shadow-2xs"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
        <i className="ri-time-line text-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-amber-700">
          {pendingCount} Payroll Run{pendingCount > 1 ? "s" : ""} Awaiting Approval
        </p>
        <p className="text-[11px] text-amber-600/80 mt-0.5">
          Click to review and sign off — runs are pending disbursement authorization.
        </p>
      </div>
      <span className="text-[11px] font-bold text-amber-600 group-hover:text-amber-800 transition-colors whitespace-nowrap flex items-center gap-1">
        Review now <i className="ri-arrow-right-line" />
      </span>
    </div>
  );
});
