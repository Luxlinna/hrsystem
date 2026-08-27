import { memo } from "react";

interface FinanceMetricCardsProps {
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  filteredCount: number;
  statusFilter: string;
  onFilterStatus: (status: string) => void;
}

export const FinanceMetricCards = memo(function FinanceMetricCards({
  totalAmount,
  paidAmount,
  approvedAmount,
  pendingAmount,
  filteredCount,
  statusFilter,
  onFilterStatus,
}: FinanceMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Total Expenses */}
      <div
        onClick={() => onFilterStatus("all")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Total Expenses</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-wallet-3-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">${(totalAmount / 1000).toFixed(1)}k</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          ${totalAmount.toLocaleString()} across {filteredCount} records
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Paid / Disbursed */}
      <div
        onClick={() => onFilterStatus("paid")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "paid" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Paid / Disbursed</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-check-double-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">${(paidAmount / 1000).toFixed(1)}k</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Disbursed transactions</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Approved (Pending Payment) */}
      <div
        onClick={() => onFilterStatus("approved")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "approved" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Approved</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">${(approvedAmount / 1000).toFixed(1)}k</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Ready for payout</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Pending Review */}
      <div
        onClick={() => onFilterStatus("pending")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          statusFilter === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">${(pendingAmount / 1000).toFixed(1)}k</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Awaiting authorization</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
});
