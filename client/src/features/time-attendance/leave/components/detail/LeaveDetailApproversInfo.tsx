import { memo, useEffect, useState, useCallback } from "react";
import type { LeaveRequest } from "../../types";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../utils/leaveDisplayUtils";
import {
  type ApproverStepConfig,
  getStoredApproverFlow,
} from "../../services/leaveApprovalFlowService";

interface LeaveDetailApproversInfoProps {
  request: LeaveRequest;
  onOpenFlowSettings?: () => void;
}

export const LeaveDetailApproversInfo = memo(function LeaveDetailApproversInfo({
  request: r,
}: LeaveDetailApproversInfoProps) {
  const [steps, setSteps] = useState<ApproverStepConfig[]>([]);
  const branchId = r.employees?.branch_id;

  const loadFlow = useCallback(() => {
    setSteps(getStoredApproverFlow(branchId));
  }, [branchId]);

  useEffect(() => {
    loadFlow();
    window.addEventListener("leave_approver_flow_updated", loadFlow);
    return () => window.removeEventListener("leave_approver_flow_updated", loadFlow);
  }, [loadFlow]);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="text-[#0284c7] font-semibold text-xs tracking-wider uppercase">
          APPROVERS INFO
        </div>
        <Link
          to="/branches?tab=approval-flow"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <i className="ri-settings-3-line text-sm" />
          <span>Adjust in Organization</span>
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Step Banner */}
            <div className="bg-[#3b82f6] text-white text-xs font-semibold px-4 py-1.5 text-center flex items-center justify-center gap-2">
              <span>{step.stepTitle}</span>
              <span className="text-[10px] px-2 py-0.2 bg-white/20 rounded font-normal">
                {step.condition === "OR" ? "Any Approver (OR)" : "All Approvers (AND)"}
              </span>
            </div>

            {/* Approvers list */}
            <div className="divide-y divide-gray-100 bg-white">
              {step.approvers.map((item, index) => {
                const isApproved =
                  r.status === "approved" &&
                  (index === 1 || r.approved_by === item.id || step.approvers.length === 1);

                return (
                  <div key={item.id}>
                    {index > 0 && (
                      <div className="text-center py-1 text-[11px] font-bold text-gray-400 bg-gray-50/50 uppercase tracking-widest border-y border-gray-100">
                        {step.condition}
                      </div>
                    )}
                    <div className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {item.avatar_url ? (
                          <img
                            src={item.avatar_url}
                            alt={item.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                            {item.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-xs text-gray-800">{item.name}</div>
                          <div className="text-[11px] text-gray-400">{item.role}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isApproved ? (
                          <div>
                            <span className="inline-block px-2.5 py-0.5 bg-[#14b8a6] text-white text-[10px] font-semibold rounded shadow-2xs">
                              Approved
                            </span>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              On {formatDateTime(r.created_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 bg-[#38bdf8] text-white text-[10px] font-semibold rounded shadow-2xs">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {step.approvers.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 italic">
                  No approvers assigned to this step yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
