import React, { useState, useRef, useEffect } from "react";
import type { WorkSite } from "../../types";

interface SiteActionMenuProps {
  site: WorkSite;
  canManage: boolean;
  onView: (site: WorkSite) => void;
  onEdit: (site: WorkSite) => void;
  onToggleStatus: (site: WorkSite) => void;
  onDelete: (site: WorkSite) => void;
}

export function SiteActionMenu({
  site,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: SiteActionMenuProps) {
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isDisabled = site.status === "disabled";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Cog dropdown button matching screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white rounded text-xs shadow-2xs cursor-pointer transition-colors"
        title="Actions"
      >
        <i className="ri-settings-4-fill text-xs" />
        <i className={`ri-arrow-down-s-fill text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-full top-0 mr-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl py-1 z-50 animate-in fade-in slide-in-from-right-1 duration-150">
          {/* 1. View */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onView(site);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <i className="ri-eye-line text-slate-500 text-sm" />
            <span>View this site</span>
          </button>

          {/* 2. Edit */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit(site);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <i className="ri-edit-line text-slate-500 text-sm" />
              <span>Edit this site</span>
            </button>
          )}

          {/* 3. Enable / Disable */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleStatus(site);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <i className={`${isDisabled ? "ri-checkbox-circle-line text-emerald-500" : "ri-forbid-line text-slate-500"} text-sm`} />
              <span>{isDisabled ? "Enable this site" : "Disable this site"}</span>
            </button>
          )}

          {/* 4. Delete */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDelete(site);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-700/60 mt-0.5 pt-1.5"
            >
              <i className="ri-delete-bin-line text-rose-500 text-sm" />
              <span>Delete this site</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
