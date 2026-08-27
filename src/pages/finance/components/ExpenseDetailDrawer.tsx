import { memo } from "react";
import type { Expense, ExpenseStatus } from "../types";
import { STATUS_CONFIG } from "../constants";

interface ExpenseDetailDrawerProps {
  selectedExpense: Expense | null;
  canManage: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ExpenseStatus) => void;
  onOpenEditModal: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ExpenseDetailDrawer = memo(function ExpenseDetailDrawer({
  selectedExpense,
  canManage,
  onClose,
  onUpdateStatus,
  onOpenEditModal,
  onDeleteExpense,
}: ExpenseDetailDrawerProps) {
  if (!selectedExpense) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Expense Transaction Details</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(selectedExpense.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Amount Highlight Card */}
            <div className="p-5 bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl text-white shadow-md">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
                Expenditure Amount
              </span>
              <p className="text-3xl font-black text-white mt-1">
                ${Number(selectedExpense.amount).toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold text-white/80">{selectedExpense.category}</span>
                <span>·</span>
                <span className="text-xs text-white/70">{selectedExpense.branches?.name || "HQ"}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Approval & Payment Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  STATUS_CONFIG[selectedExpense.status]?.bg
                } ${STATUS_CONFIG[selectedExpense.status]?.text} border ${
                  STATUS_CONFIG[selectedExpense.status]?.border
                }`}
              >
                <i className={STATUS_CONFIG[selectedExpense.status]?.icon} />
                {STATUS_CONFIG[selectedExpense.status]?.label}
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Submitted By
                </span>
                <p className="text-xs font-bold text-gray-900 mt-1">
                  {selectedExpense.submitted_by || "Finance Team"}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Branch Allocation
                </span>
                <p className="text-xs font-bold text-gray-900 mt-1">
                  {selectedExpense.branches?.name || "General HQ"}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedExpense.description && (
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Description & Invoicing Notes
                </span>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed">
                  {selectedExpense.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
          {canManage && selectedExpense.status === "pending" && (
            <>
              <button
                onClick={() => onUpdateStatus(selectedExpense.id, "approved")}
                className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Approve Expense
              </button>
              <button
                onClick={() => onUpdateStatus(selectedExpense.id, "rejected")}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Reject
              </button>
            </>
          )}

          {canManage && selectedExpense.status === "approved" && (
            <button
              onClick={() => onUpdateStatus(selectedExpense.id, "paid")}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Mark as Paid / Disbursed
            </button>
          )}

          {canManage && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenEditModal(selectedExpense)}
                className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                title="Edit Record"
              >
                <i className="ri-edit-line text-sm" />
              </button>

              <button
                onClick={() => onDeleteExpense(selectedExpense)}
                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="Delete Record"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
