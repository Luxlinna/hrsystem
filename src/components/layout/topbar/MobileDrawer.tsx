import React, { memo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useBranchScope } from "@/context/BranchContext";
import { DRAWER_GROUPS } from "./constants";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  avatarUrl?: string;
  userEmail?: string;
  handleLogout: () => void;
  can: (module: string) => boolean;
  isAdmin: boolean;
  isBranchAdmin?: boolean;
  canOpenRecycleBin: boolean;
}

/**
 * Slide-in navigation drawer for mobile viewports.
 *
 * Wrapped in React.memo — re-renders only when one of its explicit props
 * changes. Previously re-rendered on every TopBar state change (e.g. every
 * search keystroke) because it lived in the same component scope.
 *
 * DRAWER_GROUPS is imported from constants.ts (module scope) so it is never
 * re-allocated at render time.
 */
const MobileDrawer = memo(function MobileDrawer({
  open,
  onClose,
  displayName,
  avatarUrl,
  userEmail,
  handleLogout,
  can,
  isAdmin,
  isBranchAdmin,
  canOpenRecycleBin,
}: MobileDrawerProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const {
    visibleBranches,
    selectedBranchId,
    setSelectedBranchId,
    userBranchName,
    isSuperAdmin,
  } = useBranchScope();
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const isDragging = useRef(false);
  const [dragX, setDragX] = React.useState(0);

  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const displayContact = isPhoneSyntheticEmail(userEmail)
    ? formatDisplayPhone(syntheticEmailToPhone(userEmail))
    : userEmail;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
    setDragX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    touchCurrentX.current = e.touches[0].clientX;
    if (dx < 0) setDragX(dx);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (touchCurrentX.current - touchStartX.current < -80) onClose();
    setDragX(0);
  };

  const visibleGroups = DRAWER_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => can(item.module)) }))
    .filter((group) => group.items.length > 0);

  if (isAdmin || isBranchAdmin || canOpenRecycleBin) {
    visibleGroups.push({
      label: "Admin",
      items: [
        { path: "/recycle-bin", label: "Recycle Bin", icon: "ri-delete-bin-6-line", module: "admin" },
        ...(isAdmin || isBranchAdmin ? [{ path: "/admin", label: "Admin Portal", icon: "ri-admin-line", module: "admin" }] : []),
      ],
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />

      {/* Drawer panel */}
      <div
        className="lg:hidden fixed top-0 left-0 h-full w-72 bg-[#1A1A1A] z-[70] flex flex-col overflow-hidden transition-transform duration-150"
        style={{ transform: `translateX(${Math.min(0, dragX)}px)`, opacity: dragX < 0 ? Math.max(0.5, 1 + dragX / 288) : 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="HRM_OPS" className="w-7 h-7 object-contain" />
            <span className="text-[13px] font-semibold text-white tracking-wide">HRM_OPS</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 cursor-pointer transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark
                ? <i className="ri-sun-line text-lg text-amber-400" />
                : <i className="ri-moon-line text-lg text-gray-300" />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Mobile Branch Switcher / Indicator */}
        <div className="px-5 py-2.5 border-b border-white/10 bg-white/5">
          {(isSuperAdmin || (isBranchAdmin && visibleBranches.length > 1)) ? (
            <div className="flex items-center gap-2">
              <i className="ri-building-line text-[#60A5FA] text-sm shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-[#262626] text-white border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {visibleBranches.length === 0 && <option value="">No Branches</option>}
                {visibleBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.is_site ? `↳ ${b.name} (Site)` : b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : userBranchName ? (
            <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold">
              <i className="ri-map-pin-2-fill text-[#60A5FA] text-sm shrink-0" />
              <span className="truncate">Branch: {userBranchName}</span>
            </div>
          ) : null}
        </div>

        {/* Swipe hint */}
        <div className="px-5 pt-2 pb-0.5 flex items-center gap-1.5">
          <i className="ri-arrow-left-s-line text-gray-600 text-xs" />
          <span className="text-[10px] text-gray-600">Swipe left to close</span>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 mb-1 block">
                {group.label}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${
                        isActive
                          ? "bg-[#29ABE2]/20 text-[#29ABE2]"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <i className={`${item.icon} text-base w-5 h-5 flex items-center justify-center shrink-0`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1">
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                : <div className="w-9 h-9 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[12px] font-bold shrink-0">{initials}</div>
              }
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-gray-500 truncate">{displayContact}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 cursor-pointer transition-colors"
              title="Sign out"
            >
              <i className="ri-logout-box-r-line text-sm" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

export default MobileDrawer;
