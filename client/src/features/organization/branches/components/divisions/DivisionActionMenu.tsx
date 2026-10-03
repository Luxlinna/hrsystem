import { useState, useRef, useEffect } from "react";
import type { Division } from "../../types";

interface DivisionActionMenuProps {
  division: Division;
  onView: (div: Division) => void;
  onEdit: (div: Division) => void;
  onToggleStatus: (div: Division) => void;
  onDelete: (div: Division) => void;
}

export function DivisionActionMenu({
  division,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: DivisionActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isDisabled = division.status === "disabled";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
        title="Actions"
      >
        <i className="ri-more-2-fill text-sm" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onView(division);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-eye-line text-slate-400" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit(division);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-edit-line text-slate-400" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleStatus(division);
            }}
            className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
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
              setIsOpen(false);
              onDelete(division);
            }}
            className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-delete-bin-line" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
