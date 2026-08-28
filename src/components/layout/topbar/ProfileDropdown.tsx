import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { useClickOutside } from "./useClickOutside";

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

  const close = () => onOpenChange(false);

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="topbar-profile-btn"
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-lg object-cover" />
          : <div className="w-8 h-8 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[12px] font-bold">{initials}</div>
        }
        <span className="hidden md:block text-[13px] font-medium text-gray-700">{displayName}</span>
        <i className="ri-arrow-down-s-line text-sm text-gray-700" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* User header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[13px] font-semibold text-gray-900">{displayName}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{userEmail}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={close}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i className="ri-user-line text-sm text-gray-400" /> My Profile
            </Link>

            {can("settings") && (
              <Link
                to="/settings"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="ri-settings-3-line text-sm text-gray-400" /> Settings
              </Link>
            )}

            {(isAdmin || isBranchAdmin) && (
              <Link
                to="/admin"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="ri-admin-line text-sm text-gray-400" /> Admin Portal
              </Link>
            )}

            {(isAdmin || canOpenRecycleBin) && (
              <Link
                to="/recycle-bin"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="ri-delete-bin-6-line text-sm text-gray-400" /> Recycle Bin
              </Link>
            )}

            {can("analytics") && (
              <Link
                to="/analytics"
                onClick={close}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="ri-bar-chart-2-line text-sm text-gray-400" /> Analytics
              </Link>
            )}
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
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
