import { useState, useRef, useEffect } from "react";
import type { Department } from "../../types";

interface DepartmentActionMenuProps {
  department: Department;
  onView: (dept: Department) => void;
  onEdit: (dept: Department) => void;
  onToggleStatus: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

export function DepartmentActionMenu({
  department,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: DepartmentActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isDisabled = department.status === "disabled";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Cog button [ ⚙ ∨ ] */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#2b8de3] text-[#2b8de3] rounded text-xs font-medium shadow-2xs cursor-pointer transition-colors"
      >
        <i className="ri-settings-3-line text-xs" />
        <i className="ri-arrow-down-s-line text-xs -mr-0.5" />
      </button>

      {open && (
        <div className="absolute right-full top-0 mr-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onView(department);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-eye-line text-slate-400" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(department);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-edit-line text-slate-400" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onToggleStatus(department);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
          >
            <i
              className={
                isDisabled
                  ? "ri-checkbox-circle-line text-emerald-500"
                  : "ri-forbid-line text-amber-500"
              }
            />
            <span>{isDisabled ? "Enable" : "Disable"}</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(department);
            }}
            className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-delete-bin-line text-rose-500" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
