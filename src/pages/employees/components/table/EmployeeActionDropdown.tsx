import { memo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";

interface EmployeeActionDropdownProps {
  employee: Employee;
  canManage: boolean;
  onEdit?: (e: Employee) => void;
  onSetUpPhoneAccount?: (e: Employee) => void;
  onDelete: (e: Employee) => void;
  onDisable?: (e: Employee) => void;
  onDeactivate?: (e: Employee) => void;
}

export const EmployeeActionDropdown = memo(function EmployeeActionDropdown({
  employee: e,
  canManage,
  onEdit,
  onSetUpPhoneAccount,
  onDelete,
  onDisable,
  onDeactivate,
}: EmployeeActionDropdownProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = window.innerWidth - rect.right;
      if (spaceBelow < 280 && rect.top > 240) {
        setCoords({ bottom: window.innerHeight - rect.top + 6, right: Math.max(12, right) });
      } else {
        setCoords({ top: rect.bottom + 6, right: Math.max(12, right) });
      }
    }
    setShowMenu((prev) => !prev);
  };

  const isInactive = e.status === "inactive" || e.status === "exited" || e.status === "deactivated";

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-[#253C7D] dark:hover:text-sky-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer text-xs shadow-2xs"
        title="Actions"
      >
        <i className="ri-settings-3-line text-xs" />
        <i className="ri-arrow-down-s-line text-[10px] text-slate-400" />
      </button>

      {showMenu && coords && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={(ev) => { ev.stopPropagation(); setShowMenu(false); }} />
          <div
            onClick={(ev) => ev.stopPropagation()}
            style={{ position: "fixed", top: coords.top !== undefined ? `${coords.top}px` : undefined, bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined, right: `${coords.right}px` }}
            className="w-52 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl py-1 z-[9999] text-left text-xs"
          >
            <Link to={`/employees/${e.id}`} onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60">
              <i className="ri-user-line text-slate-400" /> View Profile
            </Link>

            {canManage && (
              <>
                <button type="button" onClick={() => { setShowMenu(false); onEdit?.(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer">
                  <i className="ri-edit-line text-slate-400" /> Edit Employee
                </button>

                <button type="button" onClick={() => { setShowMenu(false); onSetUpPhoneAccount?.(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer">
                  <i className="ri-smartphone-line text-blue-500" /> Update User Account
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                {isInactive ? (
                  <button type="button" onClick={() => { setShowMenu(false); onDeactivate?.(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer">
                    <i className="ri-user-follow-line" /> Activate Employee
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => { setShowMenu(false); onDisable?.(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer">
                      <i className="ri-pause-circle-line" /> Disable Employee
                    </button>
                    <button type="button" onClick={() => { setShowMenu(false); onDeactivate?.(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer">
                      <i className="ri-user-unfollow-line" /> Exit / Deactivate
                    </button>
                  </>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />

                <button type="button" onClick={() => { setShowMenu(false); onDelete(e); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer">
                  <i className="ri-delete-bin-line" /> Delete Employee
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
});
