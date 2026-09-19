import { memo, useState, useRef, useEffect } from "react";
import type { LeaveRequest } from "../types";
import { LeaveExportMenu } from "./LeaveExportMenu";

interface LeaveHeaderProps {
  onLeaveTodayCount: number;
  filteredRequests: LeaveRequest[];
  onRequestLeave: () => void;
  canManage?: boolean;
  onRequestLeaveFor?: () => void;
  onOpenLeaveSettings?: () => void;
  canManageSettings?: boolean;
  onToast?: (toast: { type: "success" | "info" | "error"; message: string }) => void;
  onOpenHolidaysModal?: () => void;
  holidayCount?: number;
}

export const LeaveHeader = memo(function LeaveHeader({
  onLeaveTodayCount,
  filteredRequests,
  onRequestLeave,
  canManage = false,
  onRequestLeaveFor,
  onOpenLeaveSettings,
  canManageSettings = false,
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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Time & Attendance</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Absence & Leave</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Leave Management
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {onLeaveTodayCount} On Leave Today
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track employee time off, approve leave requests, and manage leave balances across the organisation.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <LeaveExportMenu filteredRequests={filteredRequests} onToast={onToast} />

        {onOpenHolidaysModal && (
          <button
            type="button"
            onClick={onOpenHolidaysModal}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-purple-50/70 border border-purple-200 text-purple-700 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
            title="Cambodia Public Holidays & Labor Law Calendar"
          >
            <i className="ri-calendar-event-line text-base text-purple-600" />
            <span>Holidays</span>
            {holidayCount !== undefined && holidayCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                {holidayCount}
              </span>
            )}
          </button>
        )}

        {/* Leaves Dropdown Menu matching Image 1 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-calendar-check-line text-base" />
            <span>Leaves</span>
            <i className={`ri-arrow-down-s-line text-base transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  onRequestLeave();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
              >
                <i className="ri-add-circle-line text-[#253C7D] text-base" />
                <span>Create Leave Request</span>
              </button>

              {canManage && onRequestLeaveFor && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onRequestLeaveFor();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <i className="ri-user-shared-line text-[#253C7D] text-base" />
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
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer border-t border-gray-100"
                >
                  <i className="ri-settings-3-line text-[#253C7D] text-base" />
                  <span>Leave Setting</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
