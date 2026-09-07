import { memo } from "react";
import type { PasswordResetRequest } from "../types";

interface PasswordResetsTabProps {
  passwordResetRequests: PasswordResetRequest[];
  actingResetId: string | null;
  onRefresh: () => void;
  onDeleteRequest: (request: PasswordResetRequest) => void;
  onPasswordResetAction: (requestId: string, action: "approve" | "reject") => void;
}

export const PasswordResetsTab = memo(function PasswordResetsTab({
  passwordResetRequests,
  actingResetId,
  onRefresh,
  onDeleteRequest,
  onPasswordResetAction,
}: PasswordResetsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Password Reset Requests</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Approve a request to email the user a secure reset link.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-refresh-line" />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        {passwordResetRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-400 dark:text-slate-500">
            <i className="ri-lock-password-line text-3xl" />
            <p className="text-sm mt-2">No password reset requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {passwordResetRequests.map((request) => {
              const isPending = request.status === "pending";
              const isActing = actingResetId === request.id;
              return (
                <div key={request.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{request.email}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          request.status === "pending"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                            : request.status === "approved"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Requested {new Date(request.requested_at).toLocaleString()}
                      {request.acted_at ? ` · Acted ${new Date(request.acted_at).toLocaleString()}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => onDeleteRequest(request)}
                      title="Move to Recycle Bin"
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-rose-950/40 hover:text-red-600 dark:hover:text-rose-400 hover:border-red-200 dark:hover:border-rose-800/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || isActing}
                      onClick={() => onPasswordResetAction(request.id, "reject")}
                      className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || isActing}
                      onClick={() => onPasswordResetAction(request.id, "approve")}
                      className="px-3 py-2 rounded-xl bg-[#253C7D] text-white text-xs font-bold hover:bg-[#1F336A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      {isActing ? "Working..." : "Approve & Send Link"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
