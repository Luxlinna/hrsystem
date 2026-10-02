import React from "react";
import type { StationeryRequest } from "../../types";
import { STATIONERY_REQUEST_STATUS_CONFIG } from "../../constants";

interface StationeryRequestsTableProps {
  requests: StationeryRequest[];
  canManage: boolean;
  onApprove: (req: StationeryRequest) => void;
  onIssue: (req: StationeryRequest) => void;
  onReject: (req: StationeryRequest) => void;
}

export function StationeryRequestsTable({
  requests,
  canManage,
  onApprove,
  onIssue,
  onReject,
}: StationeryRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
          <i className="ri-hand-coin-line text-2xl" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">No supply requisitions found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No staff requisitions matched your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Requested Item</th>
              <th className="py-3 px-4">Requester &amp; Dept</th>
              <th className="py-3 px-4">Qty</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Purpose / Note</th>
              <th className="py-3 px-4">Date Requested</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {requests.map((req) => {
              const status = STATIONERY_REQUEST_STATUS_CONFIG[req.status] || STATIONERY_REQUEST_STATUS_CONFIG.pending;
              const dateStr = new Date(req.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-900 truncate max-w-xs">{req.item_name}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-800">{req.requested_by_name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{req.department}</p>
                  </td>

                  <td className="py-3 px-4 font-black text-gray-900 tabular-nums">
                    {req.quantity}
                  </td>

                  <td className="py-3 px-4">
                    {req.urgency === "urgent" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Urgent
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 font-medium">Normal</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text} border ${status.border}`}>
                      <i className={`${status.icon} text-xs`} />
                      {status.label}
                    </span>
                    {req.rejection_reason && (
                      <p className="text-[10px] text-rose-500 mt-0.5 italic truncate max-w-xs">
                        {req.rejection_reason}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-gray-500 max-w-xs truncate" title={req.purpose || undefined}>
                    {req.purpose || "—"}
                  </td>

                  <td className="py-3 px-4 text-gray-400 tabular-nums text-[11px]">
                    {dateStr}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canManage && req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(req)}
                            className="px-2.5 py-1 bg-blue-50 text-[#253C7D] hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onIssue(req)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Issue Now
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(req)}
                            className="px-2 py-1 text-gray-400 hover:text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {canManage && req.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => onIssue(req)}
                          className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Disburse / Issue
                        </button>
                      )}

                      {req.status === "issued" && (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <i className="ri-check-double-line" />
                          Fulfilled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
