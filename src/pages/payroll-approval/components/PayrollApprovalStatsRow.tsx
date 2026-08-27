import { memo } from "react";
import { fmtFull } from "../payrollApprovalUtils";

interface PayrollApprovalStatsRowProps {
  tab: "pending" | "approved" | "history" | "itemized" | "create";
  onSelectTab: (tab: "pending" | "approved" | "history" | "itemized" | "create") => void;
  pendingCount: number;
  totalPendingNet: number;
  approvedCount: number;
  totalApprovedNet: number;
  processedCount: number;
  totalProcessedNet: number;
  itemizedCount: number;
}

export const PayrollApprovalStatsRow = memo(function PayrollApprovalStatsRow({
  tab,
  onSelectTab,
  pendingCount,
  totalPendingNet,
  approvedCount,
  totalApprovedNet,
  processedCount,
  totalProcessedNet,
  itemizedCount,
}: PayrollApprovalStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Pending Approval */}
      <div
        onClick={() => onSelectTab("pending")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending Approval
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalPendingNet)} awaiting review</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Ready for Processing / Approved */}
      <div
        onClick={() => onSelectTab("approved")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "approved" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Ready to Disburse
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{approvedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalApprovedNet)} approved</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Processed & Paid */}
      <div
        onClick={() => onSelectTab("history")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "history" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">
            Processed & Paid
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-bank-card-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{processedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalProcessedNet)} disbursed</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Itemized Records Count */}
      <div
        onClick={() => onSelectTab("itemized")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "itemized" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">
            Employee Payslips
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-user-star-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{itemizedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Historical entries loaded</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>
    </div>
  );
});
