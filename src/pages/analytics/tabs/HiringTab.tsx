import { memo, useMemo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import type { Candidate } from "../types";

interface HiringTabProps {
  hiringByDept: { name: string; open: number; candidates: number }[];
  candidates: Candidate[];
}

export const HiringTab = memo(function HiringTab({
  hiringByDept,
  candidates,
}: HiringTabProps) {
  const pipelineData = useMemo(() => [
    { stage: "Applied", count: candidates.filter((c) => c.stage === "applied").length },
    { stage: "Screening", count: candidates.filter((c) => c.stage === "screening").length },
    { stage: "Interview", count: candidates.filter((c) => c.stage === "interview").length },
    { stage: "Offer", count: candidates.filter((c) => c.stage === "offer").length },
    { stage: "Hired", count: candidates.filter((c) => c.stage === "hired").length },
  ], [candidates]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Open Roles vs Candidates by Dept</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hiringByDept} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="open" fill="#253C7D" radius={[4, 4, 0, 0]} name="Open Roles" />
              <Bar dataKey="candidates" fill="#74C8EC" radius={[4, 4, 0, 0]} name="Candidates" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl p-5">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Candidate Pipeline</h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pipelineData}>
              <defs>
                <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#253C7D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Area type="monotone" dataKey="count" stroke="#253C7D" fill="url(#pipeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
