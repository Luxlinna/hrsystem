import { memo, useState, useRef, useEffect } from "react";
import type { LeaveRequest } from "../types";
import { LeaveExportMenu } from "./LeaveExportMenu";

interface LeaveHeaderProps {
  onLeaveTodayCount: number;
  filteredRequests: LeaveRequest[];
  onRequestLeave: () => void;
  canManage?: boolean;
  onRequestLeaveFor?: () => void;
  onCreateNewLeave?: () => void;
  onOpenLeaveSettings?: () => void;
  onOpenLeaveDeductions?: () => void;
  onOpenApproverFlow?: () => void;
  canManageSettings?: boolean;
  onToast?: (toast: { type: "success" | "info" | "error"; message: string }) => void;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
}

export const LeaveHeader = memo(function LeaveHeader({
  onLeaveTodayCount: _onLeaveTodayCount,
  filteredRequests,
  onRequestLeave,
  canManage = true,
  onRequestLeaveFor,
  onCreateNewLeave,
  onOpenLeaveSettings,
  onOpenLeaveDeductions,
  onOpenApproverFlow,
  canManageSettings = true,
  onToast,
  onOpenHolidaysModal,
  holidayCount,
}: LeaveHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-700 tracking-tight">
          Leaves
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden">
          <LeaveExportMenu filteredRequests={filteredRequests} onToast={onToast} />
        </div>

        {onOpenHolidaysModal && (
          <button
            type="button"
            onClick={onOpenHolidaysModal}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-purple-50/70 border border-purple-200 text-purple-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Cambodia Public Holidays & Labor Law Calendar"
          >
            <i className="ri-calendar-event-line text-sm text-purple-600" />
            <span>Holidays</span>
            {holidayCount !== undefined && holidayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {holidayCount}
              </span>
            )}
          </button>
        )}

        {/* Leaves Dropdown Menu matching Image with Approver Flow option */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-lg text-xs sm:text-[13px] font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span>Leaves</span>
            <i className={`ri-arrow-down-s-line text-sm transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-gray-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onCreateNewLeave) onCreateNewLeave();
                  else onRequestLeave();
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <i className="ri-add-circle-line text-slate-500 text-sm" />
                <span>Create New Leave</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onRequestLeave();
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <i className="ri-mail-line text-slate-500 text-sm" />
                <span>Create Leave Request</span>
              </button>

              {canManage && onRequestLeaveFor && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onRequestLeaveFor();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium"
                >
                  <i className="ri-user-shared-line text-slate-500 text-sm" />
                  <span>Create Leave Request for</span>
                </button>
              )}

              {canManageSettings && onOpenLeaveSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenLeaveSettings();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium border-t border-gray-100"
                >
                  <i className="ri-settings-3-line text-slate-500 text-sm" />
                  <span>Leave Setting</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenLeaveDeductions) {
                    onOpenLeaveDeductions();
                  } else if (onToast) {
                    onToast({ type: "info", message: "Navigating to Leave Deductions" });
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium border-t border-gray-100"
              >
                <i className="ri-file-list-3-line text-slate-500 text-sm" />
                <span>Leave Deductions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onOpenApproverFlow) {
                    onOpenApproverFlow();
                  } else if (onToast) {
                    onToast({ type: "info", message: "Opening Approver Flow Setting" });
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium border-t border-gray-100 text-[#0284c7]"
              >
                <i className="ri-node-tree text-sky-600 text-sm" />
                <span className="font-semibold">Approver Flow Setting</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
