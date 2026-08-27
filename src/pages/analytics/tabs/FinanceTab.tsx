import { memo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { ExpenseRecord } from "../types";
import { COLORS } from "../constants";

interface FinanceTabProps {
  expenses: ExpenseRecord[];
  totalExpense: number;
  paidExpense: number;
  expenseByCategory: { name: string; value: number }[];
  expenseByStatus: { name: string; value: number }[];
}

export const FinanceTab = memo(function FinanceTab({
  expenses,
  totalExpense,
  paidExpense,
  expenseByCategory,
  expenseByStatus,
}: FinanceTabProps) {
  const stats = [
    { label: "Total Expenses", value: `$${Math.round(totalExpense).toLocaleString()}`, color: "bg-gray-50 text-gray-700" },
    { label: "Paid Out", value: `$${Math.round(paidExpense).toLocaleString()}`, color: "bg-green-50 text-green-700" },
    { label: "Pending Approval", value: expenses.filter((e) => e.status === "pending").length.toString(), color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-2">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
              />
              <Bar dataKey="value" fill="#253C7D" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Expenses by Status</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={expenseByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                {expenseByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none" }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
