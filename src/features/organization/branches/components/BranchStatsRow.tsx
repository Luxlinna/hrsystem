import { memo } from "react";

interface BranchStatsRowProps {
  totalBranches: number;
  activeBranches: number;
  totalEmployees: number;
}

export const BranchStatsRow = memo(function BranchStatsRow({
  totalBranches,
  activeBranches,
  totalEmployees,
}: BranchStatsRowProps) {
  const stats = [
    { label: "Total BU", value: totalBranches, icon: "ri-building-2-line", color: "#253C7D" },
    { label: "Active", value: activeBranches, icon: "ri-checkbox-circle-line", color: "#059669" },
    { label: "Total Employees", value: totalEmployees.toLocaleString(), icon: "ri-user-3-line", color: "#7C3AED" },
    {
      label: "Avg per BU",
      value: Math.round(totalEmployees / Math.max(totalBranches, 1)),
      icon: "ri-group-line",
      color: "#D97706",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate pr-2">
              {s.label}
            </span>
            <div
              className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${s.color}14`, color: s.color }}
            >
              <i className={`${s.icon} text-sm`} />
            </div>
          </div>
          <p className="text-xl font-black text-gray-900 mt-2">{s.value}</p>
        </div>
      ))}
    </div>
  );
});
