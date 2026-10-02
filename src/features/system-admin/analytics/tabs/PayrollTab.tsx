import { memo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import type { Employee, PayrollRecord } from "../types";

interface PayrollTabProps {
  salaryByDept: { name: string; total: number; avg: number; count: number }[];
  payroll: PayrollRecord[];
  empMap: Map<string, Employee>;
  department: string;
}

export const PayrollTab = memo(function PayrollTab({
  salaryByDept,
  payroll,
  empMap,
  department,
}: PayrollTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Payroll by Department ($k)</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="total" fill="#253C7D" radius={[6, 6, 0, 0]} name="Total" />
              <Bar dataKey="avg" fill="#74C8EC" radius={[6, 6, 0, 0]} name="Avg" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Salary Distribution</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salaryByDept}>
              <defs>
                <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#253C7D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Area type="monotone" dataKey="total" stroke="#253C7D" fill="url(#salGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-gray-900">Payroll Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                {["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payroll
                .filter((p) => department === "all" || empMap.get(p.employee_id)?.department === department)
                .map((p, i) => {
                  const emp = empMap.get(p.employee_id);
                  return (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-[13px] text-gray-900">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-600">{emp?.department || "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-600">{p.month}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-900">${Number(p.base_salary || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-[13px] text-green-600">+${Number(p.bonus || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-[13px] text-red-500">-${Number(p.deductions || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-gray-900">${Number(p.net_pay || 0).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${p.status === "processed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
