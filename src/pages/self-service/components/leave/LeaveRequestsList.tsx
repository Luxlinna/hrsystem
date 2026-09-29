import React from "react";
import type { LeaveRequest } from "@/pages/leave/types";
import { stripEmojis } from "@/pages/notifications/notificationUtils";

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled: "bg-slate-50 text-slate-600 border border-slate-200",
};

function formatLeaveDateRange(start: string, end: string, days: number): string {
  if (!start) return "";
  const startDate = new Date(start);
  const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!end || start === end) {
    return `${startStr} · ${days} day${days !== 1 ? "s" : ""}`;
  }
  const endDate = new Date(end);
  const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} – ${endStr} · ${days} days`;
}

function cleanReason(reason?: string | null): string {
  if (!reason) return "";
  return stripEmojis(reason.replace(/\[Stage:[^\]]+\]/g, "")).trim();
}

export const LeaveRequestsList: React.FC<LeaveRequestsListProps> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-white border border-slate-200/80 rounded-xl text-slate-400 p-6 text-center">
        <i className="ri-calendar-event-line text-2xl mb-1.5 text-slate-300" />
        <p className="text-xs font-semibold text-slate-600">No leave requests found</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Your submitted leave history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
      <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Request History
        </span>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded-full">
          {requests.length}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {requests.map((r) => {
          const reason = cleanReason(r.reason);
          const hasEndorsed = (r.reason || "").includes("[Stage: Manager Endorsed") || (r.reason || "").includes("[Stage: BU Admin Endorsed");

          return (
            <div
              key={r.id}
              className="flex items-start gap-3 p-3 sm:p-3.5 hover:bg-slate-50/60 transition-colors"
            >
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                  r.status === "approved"
                    ? "bg-emerald-50 text-emerald-600"
                    : r.status === "rejected"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                <i
                  className={`text-xs ${
                    r.status === "approved"
                      ? "ri-checkbox-circle-line"
                      : r.status === "rejected"
                      ? "ri-close-circle-line"
                      : "ri-time-line"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 capitalize">
                    {r.leave_type} Leave
                  </p>
                  <div className="shrink-0">
                    {r.status === "pending" && hasEndorsed ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Step 2: HR Pending
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          STATUS_COLOR[r.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {formatLeaveDateRange(r.start_date, r.end_date, r.days)}
                </p>

                {reason && (
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                    &ldquo;{reason}&rdquo;
                  </p>
                )}

                <p className="text-[10px] text-slate-400 mt-1">
                  Requested {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
