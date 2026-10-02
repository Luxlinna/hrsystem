import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { useClickOutside } from "./useClickOutside";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface ProfileDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  avatarUrl?: string;
  userEmail?: string;
  can: (module: string) => boolean;
  isAdmin: boolean;
  isBranchAdmin?: boolean;
  canOpenRecycleBin: boolean;
  handleLogout: () => void;
}

/**
 * Profile avatar button + dropdown menu.
 *
 * React.memo'd — only re-renders when profile state or permissions change,
 * not on search keystrokes or notification badge updates.
 */
const ProfileDropdown = memo(function ProfileDropdown({
  open,
  onOpenChange,
  displayName,
  avatarUrl,
  userEmail,
  can,
  isAdmin,
  isBranchAdmin,
  canOpenRecycleBin,
  handleLogout,
}: ProfileDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside([containerRef], () => onOpenChange(false));

  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const displayContact = isPhoneSyntheticEmail(userEmail)
    ? formatDisplayPhone(syntheticEmailToPhone(userEmail))
    : userEmail;

  const close = () => onOpenChange(false);

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="topbar-profile-btn"
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-lg object-cover" />
          : <div className="w-8 h-8 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[12px] font-bold">{initials}</div>
        }
        <span className="hidden md:block text-[13px] font-medium text-gray-700 dark:text-slate-200">{displayName}</span>
        <i className="ri-arrow-down-s-line text-sm text-gray-400 dark:text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">{displayContact}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={close}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors"
            >
              <i className="ri-user-line text-sm text-gray-400 dark:text-slate-500" /> My Profile
            </Link>

            {can("settings") && (
              <Link
                to="/settings"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <i className="ri-settings-3-line text-sm text-gray-400 dark:text-slate-500" /> Settings
              </Link>
            )}

            {(isAdmin || isBranchAdmin) && (
              <Link
                to="/admin"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <i className="ri-admin-line text-sm text-gray-400 dark:text-slate-500" /> Admin Portal
              </Link>
            )}

            {(isAdmin || canOpenRecycleBin) && (
              <Link
                to="/recycle-bin"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <i className="ri-delete-bin-6-line text-sm text-gray-400 dark:text-slate-500" /> Recycle Bin
              </Link>
            )}

            {can("analytics") && (
              <Link
                to="/analytics"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <i className="ri-bar-chart-2-line text-sm text-gray-400 dark:text-slate-500" /> Analytics
              </Link>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 dark:border-slate-800 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors w-full text-left cursor-pointer"
            >
              <i className="ri-logout-box-r-line text-sm" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileDropdown;
