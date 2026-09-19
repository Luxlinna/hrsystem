import React from "react";
import type { LeaveRequest } from "@/pages/leave/types";

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  cancelled: "bg-slate-50 text-slate-600 border border-slate-200",
};

export const LeaveRequestsList: React.FC<LeaveRequestsListProps> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
        <i className="ri-calendar-event-line text-3xl mb-2" />
        <p className="text-sm">No leave requests yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
      <div className="divide-y divide-gray-50">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 shrink-0">
              <i
                className={`text-lg ${
                  r.status === "approved"
                    ? "ri-checkbox-circle-line text-emerald-500"
                    : r.status === "rejected"
                    ? "ri-close-circle-line text-red-400"
                    : "ri-time-line text-amber-500"
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {r.leave_type} Leave
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {r.start_date} → {r.end_date} · {r.days} day{r.days !== 1 ? "s" : ""}
              </p>
              {r.reason && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {r.reason}
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1.5 justify-end">
                {r.status === "pending" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    STATUS_COLOR[r.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(r.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
