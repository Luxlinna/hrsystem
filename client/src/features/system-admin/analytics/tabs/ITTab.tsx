import { memo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
} from "recharts";
import type { ITAsset } from "../types";
import { COLORS } from "../constants";

interface ITTabProps {
  itAssets: ITAsset[];
  assignedAssets: number;
  openTickets: number;
  itAssetsByType: { name: string; value: number }[];
  itAssetsByStatus: { name: string; value: number }[];
  ticketsByPriority: { name: string; value: number }[];
  ticketsByStatus: { name: string; value: number }[];
}

export const ITTab = memo(function ITTab({
  itAssets,
  assignedAssets,
  openTickets,
  itAssetsByType,
  itAssetsByStatus,
  ticketsByPriority,
  ticketsByStatus,
}: ITTabProps) {
  const stats = [
    { label: "Total Assets", value: itAssets.length, color: "bg-sky-50 text-sky-700" },
    { label: "Assigned", value: assignedAssets, color: "bg-green-50 text-green-700" },
    { label: "Open Tickets", value: openTickets, color: "bg-amber-50 text-amber-700" },
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
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Assets by Type</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={itAssetsByType} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                {itAssetsByType.map((_, i) => (
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
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketsByPriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="value" fill="#253C7D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Asset Status</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={itAssetsByStatus} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                {itAssetsByStatus.map((_, i) => (
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
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Ticket Status</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ticketsByStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="value" fill="#74C8EC" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
