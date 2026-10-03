import { memo } from "react";
import type { Expense, ExpenseStatus } from "../types";
import { ExpenseCard } from "./ExpenseCard";

interface FinanceCardsViewProps {
  expenses: Expense[];
  canManage: boolean;
  onSelect: (expense: Expense) => void;
  onUpdateStatus: (id: string, status: ExpenseStatus) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onOpenNewExpense: () => void;
}

export const FinanceCardsView = memo(function FinanceCardsView({
  expenses,
  canManage,
  onSelect,
  onUpdateStatus,
  onEdit,
  onDelete,
  onOpenNewExpense,
}: FinanceCardsViewProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-file-list-3-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Expense Records Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No entries match your selected category, date range, and filters.
        </p>
        {canManage && (
          <button
            onClick={onOpenNewExpense}
            className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
          >
            + Create New Expense
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {expenses.map((d) => (
        <ExpenseCard
          key={d.id}
          expense={d}
          canManage={canManage}
          onSelect={onSelect}
          onUpdateStatus={onUpdateStatus}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});
