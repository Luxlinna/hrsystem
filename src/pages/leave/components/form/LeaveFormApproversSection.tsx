import React from "react";
import type { Employee } from "../../types";

interface LeaveFormApproversSectionProps {
  lineManager: Employee | null;
  myApproverName: string;
  isDirectHrApproval?: boolean;
}

export function LeaveFormApproversSection({
  lineManager,
  myApproverName,
  isDirectHrApproval = false,
}: LeaveFormApproversSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-[#4A72B2] uppercase tracking-wider flex items-center gap-2">
          <i className="ri-shield-check-line text-base" />
          Approvers Info
        </h2>
        {isDirectHrApproval ? (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 flex items-center gap-1.5">
            <i className="ri-checkbox-circle-fill text-xs text-emerald-600" />
            1-Step Direct Approval Chain
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
            2-Step Approval Chain
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* If Super Admin or BE/BU Admin: Step 1 (Manager) is bypassed completely */}
        {!isDirectHrApproval && (
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
              <span>Step 1 — Employee Direct Manager</span>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                First Endorsement
              </span>
            </div>
            <div className="p-4 bg-white">
              {lineManager ? (
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
                      <p className="text-xs font-bold text-gray-900">
                        {lineManager.first_name} {lineManager.last_name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {lineManager.role || "Line Manager"}
                        {lineManager.department ? ` • ${lineManager.department}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200 whitespace-nowrap">
                    Direct Supervisor
                  </span>
                </div>
              ) : myApproverName ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-blue-200">
                      {myApproverName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{myApproverName}</p>
                      <p className="text-[11px] text-gray-500">Direct Line Manager</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
                    Assigned Manager
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center border border-gray-200">
                      <i className="ri-user-follow-line text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Department Manager / Supervisor
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Employee must request first; line manager will review and endorse before HR
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    Department Lead
                  </span>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                <i className="ri-information-line text-[#253C7D]" />
                Employee requests &rarr; Direct manager reviews and endorses &rarr; Forwards to HR Manager.
              </p>
            </div>
          </div>
        )}

        {/* HR Division Final Authorization */}
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
            <span>
              {isDirectHrApproval ? "Step 1 — Final Authorization (HR Division)" : "Step 2 — Final Authorization"}
            </span>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
              Final Sign-Off
            </span>
          </div>

          <div className="p-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <i className="ri-shield-check-line text-lg" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    HR Division / Final Approval Authority
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Authorized leave approval team (HR Division)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                Final Authority
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-line text-emerald-600 text-xs flex-shrink-0" />
              {isDirectHrApproval ? (
                <span>Admin request: Direct manager review is not required. Directly routed to HR Division for final approval.</span>
              ) : (
                <span>After line manager endorsement, automatically routed for final sign-off.</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
