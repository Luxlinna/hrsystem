import React from "react";

interface LeaveStatsCardsProps {
  remainingDays: number;
  totalRequests: number;
  totalApproved: number;
  totalPending: number;
  onNewRequest: () => void;
}

export const LeaveStatsCards: React.FC<LeaveStatsCardsProps> = ({
  remainingDays,
  totalRequests,
  totalApproved,
  totalPending,
  onNewRequest,
}) => {
  const cards = [
    { label: "Days Remaining", value: remainingDays, highlight: true },
    { label: "Total Requests", value: totalRequests },
    { label: "Days Approved", value: totalApproved },
    { label: "Pending", value: totalPending },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-0">
        {cards.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 text-center border transition-all ${
              s.highlight
                ? "bg-[#253C7D]/5 border-[#253C7D]/20 shadow-2xs"
                : "bg-white border-gray-100"
            }`}
          >
            <p
              className={`text-2xl font-bold ${
                s.highlight ? "text-[#253C7D]" : "text-gray-900"
              }`}
            >
              {s.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNewRequest}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
      >
        <i className="ri-add-line text-base" />
        New Request
      </button>
    </div>
  );
};
