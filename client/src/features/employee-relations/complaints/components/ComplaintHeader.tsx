import { memo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface ComplaintHeaderProps {
  onNew: () => void;
  canManage?: boolean;
}

export const ComplaintHeader = memo(function ComplaintHeader({
  onNew,
  canManage = true,
}: ComplaintHeaderProps) {
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
        Complaints/Suggestions
      </h1>

      {/* Top Right Header Dropdown with Primary Logo Color #253C7D */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-4 py-1.5 rounded-sm bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <span>Complaints/Suggestions</span>
            <i
              className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 w-56 rounded-md bg-white border border-slate-200/90 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="py-0.5">
                <Link
                  to="/employees"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-[#253C7D] hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-team-line text-base text-slate-400 shrink-0 w-5 text-center" />
                  <span>Employees</span>
                </Link>

                <Link
                  to="/change-statuses"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-[#253C7D] hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-route-line text-base text-slate-400 shrink-0 w-5 text-center" />
                  <span>Change Status</span>
                </Link>

                <Link
                  to="/exit"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-[#253C7D] hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-user-unfollow-line text-base text-slate-400 shrink-0 w-5 text-center" />
                  <span>Exits</span>
                </Link>

                <Link
                  to="/warnings"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-normal text-slate-700 hover:text-[#253C7D] hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-error-warning-line text-base text-slate-400 shrink-0 w-5 text-center" />
                  <span>Warnings</span>
                </Link>

                <Link
                  to="/complaints"
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#253C7D] bg-[#253C7D]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <i className="ri-feedback-line text-base text-[#253C7D] shrink-0 w-5 text-center" />
                  <span>Complaints/Suggestions</span>
                </Link>
              </div>

              {canManage && (
                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onNew();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <i className="ri-add-circle-line text-sm text-[#253C7D] shrink-0 w-5 text-center" />
                    <span>Create New Complaint/Suggestion</span>
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
