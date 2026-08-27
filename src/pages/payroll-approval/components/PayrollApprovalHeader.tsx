import { memo } from "react";

interface PayrollApprovalHeaderProps {
  canManage: boolean;
  onOpenCreate: () => void;
}

export const PayrollApprovalHeader = memo(function PayrollApprovalHeader({
  canManage,
  onOpenCreate,
}: PayrollApprovalHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Financial Governance</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Payroll Approval & Disbursement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <span>Payroll Approval Queue</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            Complete Historical Logs
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review department payroll batches, verify calculations, sign off 2-tier approval chains, and inspect itemized records.
        </p>
      </div>

      {canManage && (
        <button
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-add-circle-line text-base font-bold" />
          New Payroll Run
        </button>
      )}
    </div>
  );
});
