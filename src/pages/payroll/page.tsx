import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/lib/supabase";

export default function Payroll() {
  const [payroll, setPayroll] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("payroll_records").select("*").eq("month", "2026-05").then(({ data }) => setPayroll(data || []));
  }, []);

  const totalNet = payroll.reduce((s, p) => s + Number(p.net_pay || 0), 0);
  const totalBase = payroll.reduce((s, p) => s + Number(p.base_salary || 0), 0);
  const totalBonus = payroll.reduce((s, p) => s + Number(p.bonus || 0), 0);
  const totalDeductions = payroll.reduce((s, p) => s + Number(p.deductions || 0), 0);

  const chartData = payroll.map((p, i) => ({
    name: `E${i + 1}`,
    base: Number(p.base_salary / 1000).toFixed(1),
    bonus: Number(p.bonus / 1000).toFixed(1),
    deductions: Number(p.deductions / 1000).toFixed(1),
    net: Number(p.net_pay / 1000).toFixed(1),
  }));

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Payroll Overview</h1>
        <p className="text-[13px] text-gray-500 mt-1">Manage and review payroll for May 2026 across all branches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Base Salary", value: `$${(totalBase / 1000).toFixed(1)}k`, color: "bg-[#0D7377]/10 text-[#0D7377]" },
          { label: "Total Bonuses", value: `$${(totalBonus / 1000).toFixed(1)}k`, color: "bg-green-50 text-green-700" },
          { label: "Total Deductions", value: `$${(totalDeductions / 1000).toFixed(1)}k`, color: "bg-red-50 text-red-700" },
          { label: "Net Payout", value: `$${(totalNet / 1000).toFixed(1)}k`, color: "bg-blue-50 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-100 rounded-xl p-5 md:p-6 mb-8">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Payroll Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="base" fill="#0D7377" radius={[4, 4, 0, 0]} name="Base" />
              <Bar dataKey="bonus" fill="#54BAB9" radius={[4, 4, 0, 0]} name="Bonus" />
              <Bar dataKey="deductions" fill="#E11D48" radius={[4, 4, 0, 0]} name="Deductions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-6 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <span>Employee</span>
          <span>Base Salary</span>
          <span>Bonus</span>
          <span>Deductions</span>
          <span>Net Pay</span>
          <span>Status</span>
        </div>
        {payroll.map((p, i) => (
          <div key={p.id} className="grid grid-cols-6 px-5 py-4 border-t border-gray-50 items-center">
            <span className="text-[13px] font-semibold text-gray-900">Employee {i + 1}</span>
            <span className="text-[13px] text-gray-700">${Number(p.base_salary).toLocaleString()}</span>
            <span className="text-[13px] text-green-600">+${Number(p.bonus).toLocaleString()}</span>
            <span className="text-[13px] text-red-600">-${Number(p.deductions).toLocaleString()}</span>
            <span className="text-[13px] font-bold text-gray-900">${Number(p.net_pay).toLocaleString()}</span>
            <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit ${
              p.status === "processed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
            }`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}