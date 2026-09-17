import { memo, useState, useRef, useEffect } from "react";

export interface OvertimeActionDropdownProps {
  onCreateNew: () => void;
  onCreateRequest: () => void;
  onCreateRequestFor: () => void;
  onOpenSettings: () => void;
  canManage?: boolean;
}

export const OvertimeActionDropdown = memo(function OvertimeActionDropdown({
  onCreateNew,
  onCreateRequest,
  onCreateRequestFor,
  onOpenSettings,
  canManage = true,
}: OvertimeActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Main Trigger Button matching user screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs sm:text-[13px] font-bold rounded-lg sm:rounded-xl shadow-xs transition-all cursor-pointer select-none"
      >
        <span>Overtimes</span>
        <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Arrow Caret */}
          <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-slate-900 border-t border-l border-gray-100 dark:border-slate-800 rotate-45" />

          {/* 1. Create new overtime (Admin / Manager direct entry) */}
          {canManage && (
            <button
              type="button"
              onClick={() => handleSelect(onCreateNew)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <i className="ri-add-circle-line text-base text-gray-500 dark:text-slate-400" />
              <span>Create new overtime</span>
            </button>
          )}

          {/* 2. Create Overtime Request (For Self) */}
          <button
            type="button"
            onClick={() => handleSelect(onCreateRequest)}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <i className="ri-mail-send-line text-base text-gray-500 dark:text-slate-400" />
            <span>Create Overtime Request</span>
          </button>

          {/* 3. Create Overtime Request For (For Staff) */}
          {canManage && (
            <button
              type="button"
              onClick={() => handleSelect(onCreateRequestFor)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-up-down-line text-base text-gray-500 dark:text-slate-400" />
              <span>Create Overtime Request For</span>
            </button>
          )}

          {/* Divider */}
          <div className="my-1 border-t border-gray-100 dark:border-slate-800" />

          {/* 4. Overtime Setting */}
          <button
            type="button"
            onClick={() => handleSelect(onOpenSettings)}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-left font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <i className="ri-settings-3-line text-base text-gray-500 dark:text-slate-400" />
            <span>Overtime Setting</span>
          </button>
        </div>
      )}
    </div>
  );
});
