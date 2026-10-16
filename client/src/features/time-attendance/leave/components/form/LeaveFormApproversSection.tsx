import React from "react";
import type { Employee } from "../../types";
import { getLeaveEmployeeName, getLeaveEmployeeInitials } from "../../utils/leaveDisplayUtils";
import { getStoredApproverFlow } from "../../services/leaveApprovalFlowService";

interface LeaveFormApproversSectionProps {
  lineManager?: Employee | null;
  myApproverName?: string;
  hrApprovers?: Employee[];
  selectedEmployee?: Employee | null;
  isDirectHrApproval?: boolean;
}

export function LeaveFormApproversSection({
  lineManager,
  myApproverName = "",
  hrApprovers = [],
  selectedEmployee,
}: LeaveFormApproversSectionProps) {
  // Check if custom BU approval flow is configured
  const storedFlow = getStoredApproverFlow(
    selectedEmployee?.branch_id,
    selectedEmployee?.branches?.name
  );

  let approver1Name = "Mrs. Chea Tiengchanvathna";
  let approver1Role = "HR & Admin Manager";
  let approver1Avatar: string | null = null;

  let approver2Name = "Mr. Chey Tola";
  let approver2Role = "HR & Admin Division Director";
  let approver2Avatar: string | null = null;

  let condition = "OR";

  if (storedFlow.length > 0 && storedFlow[0].approvers?.length > 0) {
    const s = storedFlow[0];
    condition = s.condition || "OR";
    if (s.approvers[0]) {
      approver1Name = s.approvers[0].name;
      approver1Role = s.approvers[0].role;
      approver1Avatar = s.approvers[0].avatar_url || null;
    }
    if (s.approvers[1]) {
      approver2Name = s.approvers[1].name;
      approver2Role = s.approvers[1].role;
      approver2Avatar = s.approvers[1].avatar_url || null;
    }
  } else {
    // Dynamic fallback
    if (lineManager) {
      approver1Name = getLeaveEmployeeName(lineManager);
      approver1Role = lineManager.position || lineManager.role || "HR & Admin Manager";
      approver1Avatar = lineManager.avatar_url || null;
    } else if (myApproverName) {
      approver1Name = myApproverName;
    }

    const director = hrApprovers.find(
      (h) =>
        h.role?.toLowerCase().includes("director") ||
        h.role?.toLowerCase().includes("head") ||
        h.position?.toLowerCase().includes("director")
    );
    if (director && director.id !== lineManager?.id) {
      approver2Name = getLeaveEmployeeName(director);
      approver2Role = director.position || director.role || "HR & Admin Division Director";
      approver2Avatar = director.avatar_url || null;
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (name[0] || "A").toUpperCase();
  };

  return (
    <div className="my-2 space-y-1 w-full">
      <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
        Approvers Info
      </h3>

      <div className="space-y-1.5">
        {/* Approver 1 Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Picture / Avatar */}
            <div className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {approver1Avatar ? (
                <img
                  src={approver1Avatar}
                  alt={approver1Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
                  {getInitials(approver1Name)}
                </div>
              )}
            </div>

            {/* Name & Role */}
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {approver1Name}
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                {approver1Role}
              </div>
            </div>
          </div>

          {/* Status Badge with Clock Icon matching Phone 2 */}
          <div className="shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1 shadow-2xs">
              <i className="ri-time-line text-[11px] text-amber-600" />
              <span>Pending Approval</span>
            </span>
          </div>
        </div>

        {/* Centered OR Divider */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative px-2.5 py-0.2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[9.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-2xs">
            {condition}
          </div>
        </div>

        {/* Approver 2 Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Picture / Avatar */}
            <div className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {approver2Avatar ? (
                <img
                  src={approver2Avatar}
                  alt={approver2Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
                  {getInitials(approver2Name)}
                </div>
              )}
            </div>

            {/* Name & Role */}
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {approver2Name}
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                {approver2Role}
              </div>
            </div>
          </div>

          {/* Status Badge with Clock Icon matching Phone 2 */}
          <div className="shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1 shadow-2xs">
              <i className="ri-time-line text-[11px] text-amber-600" />
              <span>Pending Approval</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
