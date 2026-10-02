import { memo } from "react";
import type { Expense, ExpenseStatus } from "../types";
import { STATUS_CONFIG, CATEGORY_COLORS } from "../constants";

interface FinanceTableViewProps {
  expenses: Expense[];
  canManage: boolean;
  onSelect: (expense: Expense) => void;
  onUpdateStatus: (id: string, status: ExpenseStatus) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export const FinanceTableView = memo(function FinanceTableView({
  expenses,
  canManage,
  onSelect,
  onUpdateStatus,
  onEdit,
  onDelete,
}: FinanceTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="px-5 py-3.5">Category</th>
            <th className="px-5 py-3.5">Branch Location</th>
            <th className="px-5 py-3.5">Amount</th>
            <th className="px-5 py-3.5">Transaction Date</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5">Submitted By</th>
            <th className="px-5 py-3.5">Description / Remarks</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
            const catColor = CATEGORY_COLORS[d.category] || "#253C7D";

            return (
              <tr
                key={d.id}
                onClick={() => onSelect(d)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                    <span className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                      {d.category}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-semibold text-gray-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    {d.branches?.name || "General Headquarters"}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900 text-sm">
                  ${Number(d.amount).toLocaleString()}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                  {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <i className={cfg.icon} />
                    {cfg.label}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                  {d.submitted_by || "Finance Team"}
                </td>

                <td className="px-5 py-3.5 max-w-[200px] truncate text-gray-400 text-[11px]">
                  {d.description || "—"}
                </td>

                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {canManage && d.status === "pending" && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(d.id, "approved")}
                          className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onUpdateStatus(d.id, "rejected")}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {canManage && d.status === "approved" && (
                      <button
                        onClick={() => onUpdateStatus(d.id, "paid")}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Paid
                      </button>
                    )}

                    {canManage && (
                      <>
                        <button
                          onClick={() => onEdit(d)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>

                        <button
                          onClick={() => onDelete(d)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
