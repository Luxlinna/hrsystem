import { memo } from "react";
import type { PayrollRun, PayrollApproval } from "../../types";
import { STATUS_META } from "../../constants";
import { fmt, fmtFull } from "../../payrollApprovalUtils";

interface PayrollRunCardProps {
  run: PayrollRun;
  approvals: PayrollApproval[];
  canManage: boolean;
  processingId: string | null;
  onApprove: (run: PayrollRun) => void;
  onReject: (run: PayrollRun) => void;
  onProcess: (run: PayrollRun) => void;
  onViewBatch: (run: PayrollRun) => void;
}

export const PayrollRunCard = memo(function PayrollRunCard({
  run,
  approvals,
  canManage,
  processingId,
  onApprove,
  onReject,
  onProcess,
  onViewBatch,
}: PayrollRunCardProps) {
  const statusMeta = STATUS_META[run.status] || STATUS_META.draft;

  return (
    <div
      id={`payroll-run-${run.id}`}
      tabIndex={-1}
      className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4 outline-none"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-extrabold text-sm shrink-0">
            <i className="ri-folder-chart-line text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                {run.department} Department
              </h3>
              <span className="text-xs font-black text-[#253C7D] px-2 py-0.5 bg-[#253C7D]/10 rounded-full">
                {run.period}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Submitted by {run.submitted_by || "HR Admin"} &middot; {run.employee_count} Employees &middot;{" "}
              {new Date(run.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border self-start sm:self-auto ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
        >
          <i className={statusMeta.icon} />
          {statusMeta.label}
        </span>
      </div>

      {/* Financial Summary Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 text-xs">
        <div>
          <span className="text-[10px] text-gray-400 block font-medium">Base Salary</span>
          <span className="font-bold text-gray-900">{fmtFull(run.total_base)}</span>
        </div>
        <div>
          <span className="text-[10px] text-emerald-600 block font-medium">Bonuses</span>
          <span className="font-bold text-emerald-700">+{fmtFull(run.total_bonus)}</span>
        </div>
        <div>
          <span className="text-[10px] text-rose-600 block font-medium">Deductions</span>
          <span className="font-bold text-rose-700">-{fmtFull(run.total_deductions)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#253C7D] block font-bold">Total Net Payout</span>
          <span className="font-black text-sm text-[#253C7D]">{fmtFull(run.total_net)}</span>
        </div>
      </div>

      {/* Notes if available */}
      {run.notes && (
        <p className="text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-gray-100">
          <strong className="text-gray-700">Notes:</strong> {run.notes}
        </p>
      )}

      {/* 2-Tier Approval Chain Visualizer */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
          Approval Workflow Chain
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {approvals.map((app, idx) => {
            const isApproved = app.status === "approved";
            const isRejected = app.status === "rejected";
            return (
              <div
                key={app.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isApproved
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                    : isRejected
                    ? "bg-rose-50/50 border-rose-200 text-rose-900"
                    : "bg-amber-50/40 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-white text-gray-700 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs border border-gray-200">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{app.approver_name}</p>
                    <p className="text-[10px] opacity-75 truncate">{app.approver_role || "Executive"}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                    isApproved ? "bg-emerald-500 text-white" : isRejected ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => onViewBatch(run)}
          className="text-xs font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <i className="ri-list-check-2 text-sm" />
          View Itemized Batch Records ({run.employee_count})
        </button>

        {canManage && (
          <div className="flex items-center gap-2">
            {run.status === "pending_approval" && (
              <>
                <button
                  onClick={() => onReject(run)}
                  className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Reject Run
                </button>
                <button
                  onClick={() => onApprove(run)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-check-line" />
                  Sign Off / Approve
                </button>
              </>
            )}

            {run.status === "approved" && (
              <button
                onClick={() => onProcess(run)}
                disabled={processingId === run.id}
                className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <i className="ri-bank-card-line" />
                {processingId === run.id ? "Processing..." : "Process & Disburse Funds"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
