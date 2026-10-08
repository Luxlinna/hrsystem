import React from "react";
import type { Employee } from "../../types";
import type { ApplicantTier } from "../../utils/leaveApprovalChain";
import { getLeaveEmployeeName } from "../../utils/leaveDisplayUtils";

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

  const managerTitle = isManager
    ? "Step 1 — BU Admin Endorsement"
    : "Step 1 — Direct Manager";
  const managerSub = isManager
    ? "Direct Line Manager / Supervisor"
    : (lineManager ? getLeaveEmployeeName(lineManager) : myApproverName ? `${myApproverName}` : "Direct Line Manager / Supervisor");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2.5 sm:p-3.5 shadow-2xs space-y-2">
      <div className="space-y-1.5 relative">
        {/* Connecting Vertical Line */}
        {!isBuAdmin && (
          <div className="absolute left-[0.95rem] top-5 bottom-5 w-0.5 bg-[#93c5fd] z-0 pointer-events-none" />
        )}

        {/* Step 1: Direct Manager Endorsement */}
        {!isBuAdmin && (
          <div className="bg-[#eff6ff] dark:bg-blue-950/30 border border-[#dbeafe] dark:border-blue-900/50 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              {/* Number 1 Badge */}
              <div className="w-5 h-5 rounded-full bg-[#253C7D] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                1
              </div>
              
              {/* Icon Circle */}
              <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-700 shadow-2xs flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                <i className="ri-user-3-fill text-[10px]" />
              </div>

              {/* Title & Sub */}
              <div className="min-w-0">
                <h4 className="text-[11px] sm:text-xs font-bold text-[#1e3a8a] dark:text-blue-300 leading-tight truncate">
                  {managerTitle}
                </h4>
                <p className="text-[9.5px] text-slate-400 font-medium truncate mt-0.2">
                  {managerSub}
                </p>
              </div>
            </div>

            {/* Endorsement Pill */}
            <div className="px-2 py-0.5 rounded-lg bg-[#dbeafe] dark:bg-blue-900/60 text-[#1d4ed8] dark:text-blue-300 text-[9px] sm:text-[9.5px] font-bold flex items-center gap-0.5 shrink-0">
              <span>First Endorsement</span>
              <i className="ri-arrow-right-s-line text-[11px]" />
            </div>
          </div>
        )}

        {/* Step 2: HR Division Approval */}
        <div className="bg-[#ecfdf5] dark:bg-emerald-950/30 border border-[#d1fae5] dark:border-emerald-900/50 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Number 2 Badge */}
            <div className="w-5 h-5 rounded-full bg-[#059669] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
              {isBuAdmin ? "1" : "2"}
            </div>

            {/* Icon Circle */}
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-[#059669] shadow-2xs flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
              <i className="ri-shield-check-fill text-[10px]" />
            </div>

            {/* Title & Sub */}
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-[#065f46] dark:text-emerald-300 leading-tight truncate">
                {isBuAdmin ? "Direct HR Division Authorization" : "Step 2 — HR Division"}
              </h4>
              <p className="text-[9.5px] text-slate-400 font-medium truncate mt-0.2">
                Approval Authority
              </p>
            </div>
          </div>

          {/* Final Approval Pill */}
          <div className="px-2 py-0.5 rounded-lg bg-[#d1fae5] dark:bg-emerald-900/60 text-[#047857] dark:text-emerald-300 text-[9px] sm:text-[9.5px] font-bold flex items-center gap-0.5 shrink-0">
            <span>Final Approval</span>
            <i className="ri-arrow-right-s-line text-[11px]" />
          </div>
        </div>
      </div>

      {/* Footer Info Note */}
      <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
        <i className="ri-information-fill text-[#253C7D] text-[11px] shrink-0" />
        <span>Manager reviews, then routes to HR Division for final approval.</span>
      </div>
    </div>
  );
}
