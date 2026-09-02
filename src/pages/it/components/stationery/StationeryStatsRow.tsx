import React from "react";

interface StationeryStatsRowProps {
  totalItemsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingRequestsCount: number;
  onSelectFilter: (tab: "inventory" | "requests", filter?: any) => void;
}

export function StationeryStatsRow({
  totalItemsCount,
  lowStockCount,
  outOfStockCount,
  pendingRequestsCount,
  onSelectFilter,
}: StationeryStatsRowProps) {
  const stats = [
    {
      label: "Total Supply Catalog",
      value: totalItemsCount,
      sub: "Active inventory SKUs",
      icon: "ri-box-3-line",
      color: "text-[#253C7D]",
      bg: "bg-[#253C7D]/10",
      border: "border-gray-100",
      onClick: () => onSelectFilter("inventory", "all"),
    },
    {
      label: "Low Stock Alert",
      value: lowStockCount,
      sub: "Needs reordering soon",
      icon: "ri-alarm-warning-line",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: lowStockCount > 0 ? "border-amber-200" : "border-gray-100",
      onClick: () => onSelectFilter("inventory", "low_stock"),
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      sub: "Depleted supplies",
      icon: "ri-error-warning-line",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: outOfStockCount > 0 ? "border-rose-200" : "border-gray-100",
      onClick: () => onSelectFilter("inventory", "out_of_stock"),
    },
    {
      label: "Pending Requisitions",
      value: pendingRequestsCount,
      sub: "Awaiting staff issuance",
      icon: "ri-hand-coin-line",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: pendingRequestsCount > 0 ? "border-indigo-200" : "border-gray-100",
      onClick: () => onSelectFilter("requests", "pending"),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          onClick={s.onClick}
          className={`bg-white rounded-2xl p-4 border ${s.border} shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {s.label}
            </span>
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}>
              <i className={`${s.icon} ${s.color} text-base`} />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-black ${s.color} tracking-tight tabular-nums`}>
              {s.value}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
