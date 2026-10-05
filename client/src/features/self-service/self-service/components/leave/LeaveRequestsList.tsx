import React from "react";
import type { LeaveRequest } from "@/features/time-attendance/leave/types";
import { stripEmojis } from "@/features/system-admin/notifications/notificationUtils";

interface LeaveRequestsListProps {
  requests: LeaveRequest[];
  onCancelRequest?: (req: LeaveRequest, reason?: string) => Promise<void>;
  cancellingId?: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60",
  pending: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60",
  rejected: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60",
  cancelled: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
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

export const LeaveRequestsList: React.FC<LeaveRequestsListProps> = ({
  requests,
  onCancelRequest,
  cancellingId,
}) => {
  const [selectedForCancel, setSelectedForCancel] = React.useState<LeaveRequest | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = React.useState("");

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 p-6 text-center">
        <i className="ri-calendar-event-line text-2xl mb-1.5 text-slate-300 dark:text-slate-600" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No leave requests found</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Your submitted leave history will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50/80 dark:bg-slate-800/80 px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Request History
          </span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.2 rounded-full">
            {requests.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((r) => {
            const reason = cleanReason(r.reason);
            const hasEndorsed = (r.reason || "").includes("[Stage: Manager Endorsed") || (r.reason || "").includes("[Stage: BU Admin Endorsed");
            const isPending = r.status === "pending";

            return (
              <div
                key={r.id}
                className="flex items-start gap-3 p-3 sm:p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                    r.status === "approved"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                      : r.status === "rejected"
                      ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                      : r.status === "cancelled"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <i
                    className={`text-xs ${
                      r.status === "approved"
                        ? "ri-checkbox-circle-line"
                        : r.status === "rejected"
                        ? "ri-close-circle-line"
                        : r.status === "cancelled"
                        ? "ri-indeterminate-circle-line"
                        : "ri-time-line"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize">
                      {r.leave_type} Leave
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === "pending" && hasEndorsed ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Step 2: HR Pending
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            STATUS_COLOR[r.status] || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {r.status}
                        </span>
                      )}

                      {isPending && onCancelRequest && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedForCancel(r);
                            setCancelReasonInput("");
                          }}
                          disabled={cancellingId === r.id}
                          className="px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Withdraw / cancel pending request"
                        >
                          {cancellingId === r.id ? (
                            <span className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <i className="ri-close-line text-xs" />
                          )}
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {formatLeaveDateRange(r.start_date, r.end_date, r.days)}
                  </p>

                  {reason && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 italic">
                      &ldquo;{reason}&rdquo;
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Requested {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancel Request Confirmation Modal */}
      {selectedForCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-4 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <i className="ri-alert-line text-lg" />
              <span>Cancel Leave Request</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to withdraw your <strong>{selectedForCancel.leave_type}</strong> leave request ({selectedForCancel.days} day(s))?
            </p>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Schedule changed, postponed trip..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedForCancel(null)}
                disabled={Boolean(cancellingId)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onCancelRequest && selectedForCancel) {
                    await onCancelRequest(selectedForCancel, cancelReasonInput);
                    setSelectedForCancel(null);
                  }
                }}
                disabled={Boolean(cancellingId)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {cancellingId ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="ri-close-circle-line" />
                )}
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
