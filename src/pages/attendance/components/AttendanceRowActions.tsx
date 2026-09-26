import { useState, useRef, useEffect, memo } from "react";
import type { AttendanceRecord } from "../types";

interface AttendanceRowActionsProps {
  record: AttendanceRecord;
  canManage: boolean;
  onSelectRecord: (record: AttendanceRecord) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
  onLogTimeForEmployee?: (employeeId: string) => void;
}

export const AttendanceRowActions = memo(function AttendanceRowActions({
  record: r,
  canManage,
  onSelectRecord,
  onEditRecord,
  onDeleteRecord,
  onLogTimeForEmployee,
}: AttendanceRowActionsProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const emp = r.employees;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    if (actionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [actionMenuOpen]);

  return (
    <td className="py-3 px-3 w-16 text-center relative whitespace-nowrap">
      <div ref={actionMenuRef} className="inline-block text-left">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActionMenuOpen((p) => !p);
          }}
          className="inline-flex items-center justify-center gap-1 w-8 h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
          title="Options"
        >
          <i className="ri-settings-3-line text-xs text-[#253C7D] dark:text-sky-400" />
          <i className="ri-arrow-down-s-line text-[10px] text-gray-400" />
        </button>

        {actionMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl shadow-lg py-1 z-30 text-xs">
            <button
              type="button"
              onClick={() => {
                setActionMenuOpen(false);
                onEditRecord(r);
              }}
              className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-edit-line text-[#253C7D] dark:text-sky-400" />
              <span>Edit Log</span>
            </button>

            {onLogTimeForEmployee && emp?.id && (
              <button
                type="button"
                onClick={() => {
                  setActionMenuOpen(false);
                  onLogTimeForEmployee(emp.id);
                }}
                className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-time-line text-[#253C7D] dark:text-sky-400" />
                <span>Log Time</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActionMenuOpen(false);
                onSelectRecord(r);
              }}
              className="w-full px-3 py-1.5 text-left text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-file-list-3-line text-[#253C7D] dark:text-sky-400" />
              <span>View Details</span>
            </button>

            {canManage && (
              <>
                <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setActionMenuOpen(false);
                    onDeleteRecord(r.id);
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-delete-bin-line" />
                  <span>Delete Record</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </td>
  );
});
