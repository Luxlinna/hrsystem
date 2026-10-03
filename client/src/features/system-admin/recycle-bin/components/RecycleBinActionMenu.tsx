import { useState, useRef, useEffect } from "react";
import type { BinItem } from "../types";

interface RecycleBinActionMenuProps {
  item: BinItem;
  isAdmin: boolean;
  working: boolean;
  onRestore: (item: BinItem) => void;
  onConfirmDelete: (item: BinItem) => void;
}

export function RecycleBinActionMenu({
  item,
  isAdmin,
  working,
  onRestore,
  onConfirmDelete,
}: RecycleBinActionMenuProps) {
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

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Cog button [ ⚙ ∨ ] */}
      <button
        type="button"
        disabled={working}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#0088cc] text-[#0088cc] rounded text-xs font-medium shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
        title="Actions"
      >
        <i className="ri-settings-3-line text-xs" />
        <i className="ri-arrow-down-s-line text-xs -mr-0.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRestore(item);
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer font-medium"
          >
            <i className="ri-refresh-line text-emerald-600 dark:text-emerald-400 text-sm" />
            <span>Restore</span>
          </button>

          {isAdmin && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirmDelete(item);
                }}
                className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium"
              >
                <i className="ri-delete-bin-line text-rose-500 text-sm" />
                <span>Delete forever</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
