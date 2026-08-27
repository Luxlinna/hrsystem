import { memo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Employee, LeaveRequest } from "../types";
import { COLORS } from "../constants";

interface LeaveTabProps {
  leaveByDept: { name: string; days: number }[];
  leaveByType: { name: string; value: number }[];
  leaveRequests: LeaveRequest[];
  empMap: Map<string, Employee>;
  department: string;
}

export const LeaveTab = memo(function LeaveTab({
  leaveByDept,
  leaveByType,
  leaveRequests,
  empMap,
  department,
}: LeaveTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Leave Days by Department</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leaveByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="days" fill="#253C7D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Leave by Type</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leaveByType} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                {leaveByType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-gray-900">Leave Requests Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                {["Employee", "Type", "Department", "Dates", "Days", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveRequests
                .filter((l) => department === "all" || empMap.get(l.employee_id)?.department === department)
                .map((l) => {
                  const emp = empMap.get(l.employee_id);
                  return (
                    <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-[13px] text-gray-900">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-600 capitalize">{l.leave_type}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-600">{emp?.department || "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-gray-600">{l.start_date} → {l.end_date}</td>
                      <td className="px-5 py-3 text-[13px] font-medium">{l.days}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${l.status === "approved" ? "bg-green-50 text-green-700" : l.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {l.status}
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
