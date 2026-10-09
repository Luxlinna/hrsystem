import { memo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface DisciplinaryHeaderProps {
  onOpenCreateModal: () => void;
  canManage?: boolean;
  canViewEmployees?: boolean;
  canViewChangeStatus?: boolean;
  canViewExits?: boolean;
  canViewWarnings?: boolean;
  canViewComplaints?: boolean;
}

export const DisciplinaryHeader = memo(function DisciplinaryHeader({
  onOpenCreateModal,
  canManage = false,
  canViewEmployees = true,
  canViewChangeStatus = true,
  canViewExits = true,
  canViewWarnings = true,
  canViewComplaints = true,
}: DisciplinaryHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="flex items-center justify-between pt-1 pb-3">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-normal text-slate-700 dark:text-slate-200 tracking-tight">
          Warnings
        </h1>
      </div>

      {/* Top Right Actions */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-1.5 rounded-sm bg-[#1b62a5] hover:bg-[#154e85] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <span>Warnings</span>
            <i
              className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-56 rounded-md bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Workforce Navigation */}
              <div className="py-0.5">
                {canViewEmployees && (
                  <Link
                    to="/employees"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <i className="ri-team-line text-base text-slate-400 shrink-0 w-5 text-center" />
                    <span>Employees</span>
                  </Link>
                )}

                {canViewChangeStatus && (
                  <Link
                    to="/change-statuses"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <i className="ri-route-line text-base text-slate-400 shrink-0 w-5 text-center" />
                    <span>Change Status</span>
                  </Link>
                )}

                {canViewExits && (
                  <Link
                    to="/exit"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <i className="ri-user-unfollow-line text-base text-slate-400 shrink-0 w-5 text-center" />
                    <span>Exits</span>
                  </Link>
                )}

                <Link
                  to="/warnings"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-sky-600 bg-sky-50/70 dark:bg-sky-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-error-warning-line text-base text-sky-600 shrink-0 w-5 text-center" />
                  <span>Warnings</span>
                </Link>

                {canViewComplaints && (
                  <Link
                    to="/complaints"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 dark:text-slate-200 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <i className="ri-feedback-line text-base text-slate-400 shrink-0 w-5 text-center" />
                    <span>Complaints/Suggestions</span>
                  </Link>
                )}
              </div>

              {/* Actions for managers/admins */}
              {canManage && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenCreateModal();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <i className="ri-add-circle-line text-sm text-[#1b62a5] shrink-0 w-5 text-center" />
                    <span>Issue Warning / Log Incident</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
