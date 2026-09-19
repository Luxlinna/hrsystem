import React from "react";
import type { Employee } from "../../types";
import type { ApplicantTier } from "../../utils/leaveApprovalChain";

interface LeaveFormApproversSectionProps {
  lineManager: Employee | null;
  myApproverName: string;
  isDirectHrApproval?: boolean;
  applicantTier?: ApplicantTier;
}

export function LeaveFormApproversSection({
  lineManager,
  myApproverName,
  isDirectHrApproval = false,
  applicantTier = isDirectHrApproval ? "bu_admin" : "employee",
}: LeaveFormApproversSectionProps) {
  const isBuAdmin = applicantTier === "bu_admin" || isDirectHrApproval;
  const isManager = applicantTier === "manager";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-[#4A72B2] uppercase tracking-wider flex items-center gap-2">
          <i className="ri-shield-check-line text-base" />
          Approvers Info
        </h2>
        {isBuAdmin ? (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 flex items-center gap-1.5">
            <i className="ri-checkbox-circle-fill text-xs text-emerald-600" />
            1-Step Direct HR Approval
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            2-Step Approval Chain
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Step 1: BU Admin (for Manager) OR Line Manager (for Employee) */}
        {!isBuAdmin && (
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
              <span>{isManager ? "Step 1 — BU Admin Endorsement" : "Step 1 — Employee Direct Manager"}</span>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">First Endorsement</span>
            </div>
            <div className="p-4 bg-white">
              {isManager ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-indigo-200">
                      <i className="ri-shield-user-line text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">BU Admin / Branch Leadership</p>
                      <p className="text-[11px] text-gray-500">Authorized BU Admin reviews manager requests</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    BU Admin Endorsement
                  </span>
                </div>
              ) : lineManager ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {lineManager.avatar_url ? (
                      <img
                        src={lineManager.avatar_url}
                        alt={`${lineManager.first_name} ${lineManager.last_name}`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-blue-200">
                        {lineManager.first_name?.[0]}
                        {lineManager.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900">{lineManager.first_name} {lineManager.last_name}</p>
                      <p className="text-[11px] text-gray-500">{lineManager.role || "Line Manager"}{lineManager.department ? ` • ${lineManager.department}` : ""}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
                    Direct Supervisor
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-blue-200">
                      {myApproverName ? myApproverName.charAt(0) : <i className="ri-user-follow-line text-sm" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{myApproverName || "Department Manager / Supervisor"}</p>
                      <p className="text-[11px] text-gray-500">Direct Line Manager</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
                    Direct Supervisor
                  </span>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                <i className="ri-information-line text-[#253C7D]" />
                {isManager
                  ? "Manager requests → BU Admin reviews and endorses → Forwards to HR Division for final approval."
                  : "Employee requests → Direct manager reviews and endorses → Forwards to HR Division for final approval."}
              </p>
            </div>
          </div>
        )}

        {/* Step 2 (or Step 1 for BU Admin): HR Division Final Authorization */}
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
            <span>{isBuAdmin ? "Step 1 — Final Authorization (HR Division)" : "Step 2 — Final Authorization (HR Division)"}</span>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">Final Approval</span>
          </div>
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <i className="ri-shield-check-line text-lg" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">HR Division / Final Approval Authority</p>
                  <p className="text-[11px] text-gray-500 font-medium">Authorized leave approval team (HR Division)</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Final Authority
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line text-emerald-600 text-xs flex-shrink-0" />
              {isBuAdmin ? (
                <span>BU Admin request: Manager endorsement is not required. Directly routed to HR Division for final approval.</span>
              ) : isManager ? (
                <span>After BU Admin endorsement, automatically routed to HR Division for final approval.</span>
              ) : (
                <span>After line manager endorsement, automatically routed to HR Division for final approval.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
