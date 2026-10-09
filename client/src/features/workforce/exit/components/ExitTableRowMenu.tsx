import React from "react";
import type { EmployeeExit } from "../types";

interface ExitTableRowMenuProps {
  exitItem: EmployeeExit;
  isOpen: boolean;
  actionRef: React.RefObject<HTMLTableCellElement | null>;
  canManage?: boolean;
  onToggle: (id: string) => void;
  onView: (exit: EmployeeExit) => void;
  onEdit: (exit: EmployeeExit) => void;
  onDelete: (id: string) => void;
  onInterview?: (exit: EmployeeExit) => void;
}

export const ExitTableRowMenu: React.FC<ExitTableRowMenuProps> = ({
  exitItem: ex,
  isOpen,
  actionRef,
  canManage = false,
  onToggle,
  onView,
  onEdit,
  onDelete,
  onInterview,
}) => {
  return (
    <td className="py-2.5 px-3 text-center relative" ref={isOpen ? actionRef : null}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(ex.id);
        }}
        className={`h-6 w-11 rounded-[3px] inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs ${
          isOpen
            ? "bg-[#2990ea] text-white border border-[#2990ea]"
            : "bg-white text-[#2990ea] border border-[#2990ea] hover:bg-sky-50"
        }`}
      >
        <i className="ri-settings-3-fill text-xs" />
        <i className="ri-arrow-down-s-line text-[11px]" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-[34px] w-52 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-sm shadow-md py-1.5 z-50 text-[13px] animate-in fade-in zoom-in-95 duration-100 text-left"
        >
          <button
            type="button"
            onClick={() => {
              onToggle("");
              onView(ex);
            }}
            className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer font-normal leading-snug transition-colors"
          >
            <i className="ri-eye-line text-sm text-slate-500 shrink-0" />
            <span>View this exit</span>
          </button>

          {canManage && (
            <>
              <button
                type="button"
                onClick={() => {
                  onToggle("");
                  onEdit(ex);
                }}
                className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer font-normal leading-snug transition-colors"
              >
                <i className="ri-edit-box-line text-sm text-slate-500 shrink-0" />
                <span>Edit this exit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggle("");
                  onDelete(ex.id);
                }}
                className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer font-normal leading-snug transition-colors"
              >
                <i className="ri-delete-bin-line text-sm text-slate-500 shrink-0" />
                <span>Delete this Exits</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggle("");
                  onInterview?.(ex);
                }}
                className="w-full text-left px-4 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer font-normal leading-snug transition-colors"
              >
                <i className="ri-chat-1-line text-sm text-slate-500 shrink-0" />
                <span>Exit Interview</span>
              </button>
            </>
          )}
        </div>
      )}
    </td>
  );
};

