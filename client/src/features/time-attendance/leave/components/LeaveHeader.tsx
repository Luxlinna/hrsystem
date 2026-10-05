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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          <span>Portal</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Leave Management</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Leaves & Time Off
        </h1>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="hidden">
          <LeaveExportMenu filteredRequests={filteredRequests} onToast={onToast} />
        </div>

        {onOpenHolidaysModal && (
          <button
            type="button"
            onClick={onOpenHolidaysModal}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
            title="Cambodia Public Holidays & Labor Law Calendar"
          >
            <i className="ri-calendar-event-line text-sm text-slate-500" />
            <span>Holidays</span>
            {holidayCount !== undefined && holidayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {holidayCount}
              </span>
            )}
          </button>
        )}

        {/* Enterprise Actions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1d3066] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <i className="ri-add-line text-sm" />
            <span>Request Leave</span>
            <i className={`ri-arrow-down-s-line text-xs transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-700 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onRequestLeave();
                }}
                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
              >
                <i className="ri-file-add-line text-slate-500 text-sm" />
                <span>Submit Leave Request</span>
              </button>

              {onCreateNewLeave && canManageSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onCreateNewLeave();
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
                >
                  <i className="ri-add-circle-line text-slate-500 text-sm" />
                  <span>Create New Leave Type</span>
                </button>
              )}

              {canManage && onRequestLeaveFor && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onRequestLeaveFor();
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium text-slate-800"
                >
                  <i className="ri-user-shared-line text-slate-500 text-sm" />
                  <span>Create Request for Member</span>
                </button>
              )}

              {canManageSettings && onOpenLeaveSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenLeaveSettings();
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 border-t border-slate-100"
                >
                  <i className="ri-settings-3-line text-slate-500 text-sm" />
                  <span>Leave Settings</span>
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
                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-medium text-slate-800 border-t border-slate-100"
              >
                <i className="ri-file-list-3-line text-slate-500 text-sm" />
                <span>Leave Deductions</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
