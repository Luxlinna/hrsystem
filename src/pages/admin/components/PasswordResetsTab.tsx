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
          <p className="text-sm font-semibold text-gray-900">Password Reset Requests</p>
          <p className="text-xs text-gray-500">Approve a request to email the user a secure reset link.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
        >
          <i className="ri-refresh-line" />
          Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {passwordResetRequests.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <i className="ri-lock-password-line text-3xl" />
            <p className="text-sm mt-2">No password reset requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {passwordResetRequests.map((request) => {
              const isPending = request.status === "pending";
              const isActing = actingResetId === request.id;
              return (
                <div key={request.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{request.email}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          request.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : request.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
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
                      className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || isActing}
                      onClick={() => onPasswordResetAction(request.id, "reject")}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || isActing}
                      onClick={() => onPasswordResetAction(request.id, "approve")}
                      className="px-3 py-2 rounded-xl bg-[#253C7D] text-white text-xs font-bold hover:bg-[#1F336A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
