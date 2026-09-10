import { memo } from "react";
import type { HiringRequest } from "../../types";
import { formatRelative } from "../../hireUtils";

interface PendingApprovalsListProps {
  requests: HiringRequest[];
  onOpenDecision: (request: HiringRequest, action: "approved" | "rejected") => void;
}

export const PendingApprovalsList = memo(function PendingApprovalsList({
  requests,
  onOpenDecision,
}: PendingApprovalsListProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <i className="ri-shield-check-line" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Approval Pending</h3>
            <p className="text-[11px] text-gray-400">
              Headcount requisitions requiring decision sign-off for your responsibility stage
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          {requests.length} Requisitions
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <i className="ri-checkbox-circle-line text-3xl text-emerald-500 mb-1" />
          <p className="text-xs font-bold text-gray-700">No approvals pending!</p>
          <p className="text-[11px] text-gray-400">You are completely up-to-date on requisition authorizations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isUrgent = req.urgency === "urgent" || req.urgency === "high";

            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-gray-200/80 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-base font-bold shrink-0">
                    <i className="ri-file-list-3-line" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">
                        {req.title}
                      </h4>
                      {req.requisition_id && (
                        <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          {req.requisition_id}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                          isUrgent
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                      {req.department} • Headcount: <strong>{req.headcount}</strong> •{" "}
                      {req.branches?.name || "HR Division"}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                      <span>
                        <i className="ri-user-line mr-1" />
                        Requested by: {req.requested_by_name}
                      </span>
                      <span>
                        <i className="ri-calendar-line mr-1" />
                        {formatRelative(req.created_at)}
                      </span>
                      {req.salary_min && (
                        <span className="text-emerald-700 font-bold">
                          ${req.salary_min.toLocaleString()} - ${req.salary_max?.toLocaleString()}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenDecision(req, "approved")}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-check-line text-sm" />
                    Review & Decide
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
