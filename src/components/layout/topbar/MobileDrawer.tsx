import React, { memo, useRef, useState } from "react";
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
  const { visibleBranches, selectedBranchId, setSelectedBranchId, userBranchName, isSuperAdmin, isHrDivision } = useBranchScope();
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const [dragX, setDragX] = useState(0);

  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const displayContact = isPhoneSyntheticEmail(userEmail) ? formatDisplayPhone(syntheticEmailToPhone(userEmail)) : userEmail;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
    setDragX(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setDragX(dx);
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (touchCurrentX.current - touchStartX.current < -60) onClose();
    setDragX(0);
  };

  const visibleGroups = DRAWER_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((item) => can(item.module)) }))
    .filter((g) => g.items.length > 0);

  if (isAdmin || isBranchAdmin || canOpenRecycleBin) {
    visibleGroups.push({
      label: "Admin",
      items: [
        ...(canOpenRecycleBin ? [{ path: "/recycle-bin", label: "Recycle Bin", icon: "ri-delete-bin-6-line", module: "admin" }] : []),
        ...(isAdmin || isBranchAdmin ? [{ path: "/admin", label: "Admin Portal", icon: "ri-admin-line", module: "admin" }] : []),
      ],
    });
  }

  if (!open) return null;

  return (
    <>
      <div className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] animate-in fade-in duration-200" onClick={onClose} />
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-[260px] max-w-[80vw] z-[70] flex flex-col overflow-hidden shadow-2xl transition-transform duration-150 ${
          isDark ? "bg-[#161B26] text-slate-100 border-r border-slate-800" : "bg-white text-slate-800 border-r border-slate-200/90"
        }`}
        style={{ transform: `translateX(${Math.min(0, dragX)}px)`, opacity: dragX < 0 ? Math.max(0.5, 1 + dragX / 260) : 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`flex items-center justify-between px-4 py-3.5 border-b shrink-0 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/70"}`}>
          <div className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="HRM_OPS" className="w-6 h-6 object-contain" />
            <span className={`text-xs font-bold tracking-wide ${isDark ? "text-white" : "text-slate-900"}`}>HRM_OPS</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${isDark ? "text-amber-400 hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"}`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <i className={isDark ? "ri-sun-line text-sm text-amber-400" : "ri-moon-line text-sm text-slate-600"} />
            </button>
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${isDark ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"}`}
              aria-label="Close"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        <div className={`px-3.5 py-2 border-b text-[11px] ${isDark ? "border-slate-800/80 bg-slate-900/30" : "border-slate-100 bg-blue-50/30"}`}>
          {isSuperAdmin || isHrDivision || (isBranchAdmin && visibleBranches.length > 1) ? (
            <div className="flex items-center gap-1.5">
              <i className="ri-building-line text-[#253C7D] dark:text-sky-400 text-xs shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className={`w-full rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none cursor-pointer ${isDark ? "bg-slate-800 text-white border border-slate-700" : "bg-white text-slate-800 border border-slate-200"}`}
              >
                {visibleBranches.length === 0 && <option value="">No BU</option>}
                {visibleBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.is_site ? `↳ ${b.name} (Site)` : b.name}</option>
                ))}
              </select>
            </div>
          ) : userBranchName ? (
            <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
              <i className="ri-map-pin-2-fill text-[#253C7D] dark:text-sky-400 text-xs shrink-0" />
              <span className="truncate">Branch: {userBranchName}</span>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto py-2.5 space-y-3 px-2">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 mb-1 block ${isDark ? "text-slate-500" : "text-slate-400"}`}>
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
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12px] font-medium transition-all ${
                        isActive
                          ? isDark ? "bg-indigo-950/60 text-sky-400 font-bold" : "bg-[#EEF3FA] text-[#253C7D] font-bold shadow-2xs"
                          : isDark ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <i className={`${item.icon} text-sm w-4 h-4 flex items-center justify-center shrink-0 ${isActive ? (isDark ? "text-sky-400" : "text-[#253C7D]") : ""}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`shrink-0 border-t px-3.5 py-3 ${isDark ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50/70"}`}>
          <div className="flex items-center justify-between gap-2">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-2.5 min-w-0 flex-1 group">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[10px] font-bold shrink-0">{initials}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-[12px] font-bold truncate ${isDark ? "text-white group-hover:text-sky-400" : "text-slate-900 group-hover:text-[#253C7D]"}`}>{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">{displayContact}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors shrink-0"
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
