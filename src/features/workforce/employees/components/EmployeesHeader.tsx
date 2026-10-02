import { memo, useState } from "react";
import { Link } from "react-router-dom";

interface EmployeesHeaderProps {
  branchCount: number;
  canManage: boolean;
  onOpenAddModal: () => void;
  canManageSettings?: boolean;
  onOpenSettings?: () => void;
}

export const EmployeesHeader = memo(function EmployeesHeader({
  canManage,
  onOpenAddModal,
  canManageSettings,
  onOpenSettings,
}: EmployeesHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="flex items-center justify-between pt-1 pb-3">
      {/* Title */}
      <h1 className="text-xl font-normal text-slate-700 tracking-tight">
        Employees
      </h1>

      {/* Top Right Action Button matching ERP */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-4 py-1.5 rounded-sm bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <span>Employees</span>
          <i className="ri-arrow-down-s-line text-xs" />
        </button>

        {showDropdown && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-8 w-44 rounded-md bg-white border border-slate-200/90 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  onOpenAddModal();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-user-add-line text-sm text-[#253C7D]" />
                <span>Add Employee</span>
              </button>
            )}
            <Link
              to="/hire"
              onClick={() => setShowDropdown(false)}
              className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-user-search-line text-sm text-slate-500" />
              <span>Hire New</span>
            </Link>
            {canManageSettings && onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
              >
                <i className="ri-settings-3-line text-sm text-slate-500" />
                <span>Settings</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
