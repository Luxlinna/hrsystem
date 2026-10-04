import { memo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from "recharts";
import type { OffboardingRequest } from "../types";
import { COLORS } from "../constants";

interface OffboardingTabProps {
  offboarding: OffboardingRequest[];
  offboardingByReason: { name: string; value: number }[];
  offboardingByStatus: { name: string; value: number }[];
}

export const OffboardingTab = memo(function OffboardingTab({
  offboarding,
  offboardingByReason,
  offboardingByStatus,
}: OffboardingTabProps) {
  const stats = [
    { label: "Total Offboarded", value: offboarding.length, color: "bg-gray-50" },
    { label: "In Progress", value: offboarding.filter((o) => o.status !== "completed").length, color: "bg-amber-50" },
    { label: "Completed", value: offboarding.filter((o) => o.status === "completed").length, color: "bg-green-50" },
    { label: "This Month", value: offboarding.filter((o) => new Date(o.last_day).getMonth() === new Date().getMonth()).length, color: "bg-sky-50" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Departure Reasons</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={offboardingByReason} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                {offboardingByReason.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Status Breakdown</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={offboardingByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="value" fill="#253C7D" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
