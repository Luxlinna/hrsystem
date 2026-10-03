import { memo } from "react";
import type { Expense, ExpenseStatus } from "../types";
import { STATUS_CONFIG, CATEGORY_COLORS } from "../constants";

interface ExpenseCardProps {
  expense: Expense;
  canManage: boolean;
  onSelect: (expense: Expense) => void;
  onUpdateStatus: (id: string, status: ExpenseStatus) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export const ExpenseCard = memo(function ExpenseCard({
  expense,
  canManage,
  onSelect,
  onUpdateStatus,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const cfg = STATUS_CONFIG[expense.status] || STATUS_CONFIG.pending;
  const catColor = CATEGORY_COLORS[expense.category] || "#253C7D";

  return (
    <div
      onClick={() => onSelect(expense)}
      className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
              style={{ backgroundColor: catColor }}
            >
              <i className="ri-money-dollar-circle-line" />
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                {expense.category}
              </h4>
              <p className="text-[11px] text-gray-400 truncate">{expense.branches?.name || "HQ"}</p>
            </div>
          </div>

          <span
            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {cfg.label}
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs mb-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px]">Amount:</span>
            <span className="font-black text-sm text-[#253C7D]">
              ${Number(expense.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px]">Date:</span>
            <span className="font-bold text-gray-800">
              {new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[11px]">Submitted By:</span>
            <span className="font-semibold text-gray-700 truncate">{expense.submitted_by || "Finance"}</span>
          </div>
        </div>

        {expense.description && (
          <p className="text-[11px] text-gray-500 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-gray-100 mb-2">
            {expense.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-1.5">
        {canManage && expense.status === "pending" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(expense.id, "approved");
              }}
              className="flex-1 py-1.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Approve
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(expense.id, "rejected");
              }}
              className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Reject
            </button>
          </>
        )}

        {canManage && expense.status === "approved" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(expense.id, "paid");
            }}
            className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
          >
            Mark as Paid
          </button>
        )}

        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(expense);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              title="Edit"
            >
              <i className="ri-edit-line text-sm" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(expense);
              }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Delete"
            >
              <i className="ri-delete-bin-line text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
