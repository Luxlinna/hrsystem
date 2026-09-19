import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { getRequestTier } from "../../utils/leaveApprovalChain";

interface LeaveApprovalWorkflowSectionProps {
  inspectRequest: LeaveRequest;
}

export const LeaveApprovalWorkflowSection = memo(function LeaveApprovalWorkflowSection({
  inspectRequest,
}: LeaveApprovalWorkflowSectionProps) {
  const tier = getRequestTier(inspectRequest);
  const reason = inspectRequest.reason || "";
  const hasStep1Endorsed =
    reason.includes("[Stage: BU Admin Endorsed") ||
    reason.includes("[Stage: Manager Endorsed") ||
    inspectRequest.status === "approved";
  const isApproved = inspectRequest.status === "approved";
  const isRejected = inspectRequest.status === "rejected";

  if (tier === "bu_admin") {
    return (
      <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs space-y-2">
        <span className="text-[10px] font-extrabold text-[#4A72B2] uppercase tracking-wider block">
          1-Step Direct HR Approval
        </span>
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isApproved
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : isRejected
              ? "bg-rose-50/80 border-rose-200 text-rose-900"
              : "bg-sky-50/80 border-sky-200 text-sky-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isApproved ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"
              }`}
            >
              1
            </span>
            <div>
              <p className="font-bold text-[11px]">HR Division (Final Authorization)</p>
              <p className="text-[10px] opacity-80">
                {isApproved ? "✓ Final Approved by HR" : isRejected ? "Rejected" : "Awaiting HR Division Review"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/70 border border-current/20">
            Final Approval
          </span>
        </div>
      </div>
    );
  }

  const isManager = tier === "manager";

  return (
    <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs space-y-2">
      <span className="text-[10px] font-extrabold text-[#4A72B2] uppercase tracking-wider block">
        {isManager ? "2-Step Approval Status (Manager → BU Admin → HR)" : "2-Step Approval Status (Employee → Manager → HR)"}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {/* Step 1 */}
        <div
          className={`p-2.5 rounded-xl border ${
            hasStep1Endorsed
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : isRejected
              ? "bg-rose-50/80 border-rose-200 text-rose-900"
              : "bg-sky-50/80 border-sky-200 text-sky-900"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                hasStep1Endorsed ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"
              }`}
            >
              1
            </span>
            <span className="font-bold text-[11px]">{isManager ? "BU Admin" : "Line Manager"}</span>
          </div>
          <p className="text-[10px] font-medium opacity-80">
            {hasStep1Endorsed ? (isManager ? "✓ Endorsed by BU Admin" : "✓ Endorsed") : isRejected ? "Rejected" : "Awaiting Review"}
          </p>
        </div>

        {/* Step 2: HR Division */}
        <div
          className={`p-2.5 rounded-xl border ${
            isApproved
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              : isRejected
              ? "bg-rose-50/80 border-rose-200 text-rose-900"
              : hasStep1Endorsed
              ? "bg-amber-50/80 border-amber-200 text-amber-900"
              : "bg-gray-50 border-gray-200 text-gray-400"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isApproved
                  ? "bg-emerald-600 text-white"
                  : hasStep1Endorsed
                  ? "bg-amber-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </span>
            <span className="font-bold text-[11px]">HR Division</span>
          </div>
          <p className="text-[10px] font-medium opacity-80">
            {isApproved ? "✓ Final Approved" : hasStep1Endorsed ? "Pending HR Sign-Off" : "Awaiting Step 1"}
          </p>
        </div>
      </div>
    </div>
  );
});
