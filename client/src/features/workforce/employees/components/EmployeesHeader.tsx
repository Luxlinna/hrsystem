import { memo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface EmployeesHeaderProps {
  branchCount: number;
  canManage: boolean;
  onOpenAddModal: () => void;
  onOpenChangeStatus?: () => void;
  canManageSettings?: boolean;
  onOpenSettings?: () => void;
}

export const EmployeesHeader = memo(function EmployeesHeader({
  canManage,
  onOpenAddModal,
  onOpenChangeStatus,
  canManageSettings,
  onOpenSettings,
}: EmployeesHeaderProps) {
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
      <h1 className="text-xl font-normal text-slate-700 tracking-tight">
        Employees
      </h1>

      {/* Top Right Action Buttons: Employees Menu & Settings Icon */}
      <div className="flex items-center gap-2">
        {/* Employees Dropdown matching ERP Image 2 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-1.5 rounded-sm bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <span>Employees</span>
            <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {showDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-56 rounded-md bg-white border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden"
            >
              {/* Items matching Image 2 */}
              <div className="py-0.5">
                {/* 1. Employees */}
                <Link
                  to="/employees"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-sky-600 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <i className="ri-team-line text-base text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 w-5 text-center" />
                  <span>Employees</span>
                </Link>

                {/* 2. Change Status */}
                <Link
                  to="/change-statuses"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-sky-600 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <i className="ri-route-line text-base text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 w-5 text-center" />
                  <span>Change Status</span>
                </Link>

                {/* 3. Exits */}
                <Link
                  to="/exit"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-sky-600 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <i className="ri-user-unfollow-line text-base text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 w-5 text-center" />
                  <span>Exits</span>
                </Link>

                {/* 4. Warnings */}
                <Link
                  to="/warnings"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-sky-600 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <i className="ri-error-warning-line text-base text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 w-5 text-center" />
                  <span>Warnings</span>
                </Link>

                {/* 5. Complaints/Suggestions */}
                <Link
                  to="/complaints"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-sky-600 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer group"
                >
                  <i className="ri-feedback-line text-base text-slate-400 group-hover:text-sky-600 transition-colors shrink-0 w-5 text-center" />
                  <span>Complaints/Suggestions</span>
                </Link>
              </div>

              {/* Management actions (Add Employee / Hire New) */}
              {canManage && (
                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenAddModal();
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer"
                  >
                    <i className="ri-user-add-line text-sm text-[#253C7D] shrink-0 w-5 text-center" />
                    <span>Add Employee</span>
                  </button>
                  <Link
                    to="/hire"
                    onClick={() => setShowDropdown(false)}
                    className="w-full text-left px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 cursor-pointer"
                  >
                    <i className="ri-user-search-line text-sm text-slate-500 shrink-0 w-5 text-center" />
                    <span>Hire New</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
