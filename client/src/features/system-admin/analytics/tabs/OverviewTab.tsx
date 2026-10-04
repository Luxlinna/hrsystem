import { memo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from "recharts";
import type { Employee, JobPosting, PayrollRecord } from "../types";
import { COLORS } from "../constants";

interface OverviewTabProps {
  deptDistribution: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number }[];
  department: string;
  departments: string[];
  employees: Employee[];
  filteredEmps: Employee[];
  jobs: JobPosting[];
  payroll: PayrollRecord[];
}

export const OverviewTab = memo(function OverviewTab({
  deptDistribution,
  statusBreakdown,
  department,
  departments,
  employees,
  filteredEmps,
  jobs,
  payroll,
}: OverviewTabProps) {
  const targetDepts = department === "all" ? departments : [department];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Department Distribution</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value">
                {deptDistribution.map((_, i) => (
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
            <BarChart data={statusBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="value" fill="#253C7D" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-gray-900">Department Summary</h3>
          <span className="text-[11px] text-gray-400">{filteredEmps.length} employees</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                {["Department", "Headcount", "Active", "On Leave", "Open Roles", "Avg Salary"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targetDepts.map((dept) => {
                const de = employees.filter((e) => e.department === dept);
                const active = de.filter((e) => e.status === "active").length;
                const onLeave = de.filter((e) => e.status === "on_leave").length;
                const roles = jobs.filter((j) => j.department === dept && j.status === "active").length;
                const dp = payroll.filter((p) => de.find((e) => e.id === p.employee_id));
                const avg = dp.length ? Math.round(dp.reduce((s, p) => s + Number(p.net_pay || 0), 0) / dp.length / 1000) : 0;
                return (
                  <tr key={dept} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-[13px] font-medium text-gray-900">{dept}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-600">{de.length}</td>
                    <td className="px-5 py-3 text-[13px] text-green-600 font-medium">{active}</td>
                    <td className="px-5 py-3 text-[13px] text-amber-600">{onLeave}</td>
                    <td className="px-5 py-3 text-[13px] text-sky-600">{roles}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-900 font-medium">${avg}k</td>
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
