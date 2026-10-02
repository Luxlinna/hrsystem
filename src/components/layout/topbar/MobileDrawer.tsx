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
  open, onClose, displayName, avatarUrl, userEmail, handleLogout, can, isAdmin, isBranchAdmin, canOpenRecycleBin,
}: MobileDrawerProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { visibleBranches, selectedBranchId, setSelectedBranchId, userBranchName, isSuperAdmin, isHrDivision } = useBranchScope();
  const touchStartX = useRef(0), touchCurrentX = useRef(0), isDragging = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

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
    if (dx > 0) setDragX(dx);
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (touchCurrentX.current - touchStartX.current > 60) {
      setConfirmLogout(false);
      onClose();
    }
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

  const handleDrawerClose = () => {
    setConfirmLogout(false);
    onClose();
  };

  return (
    <div className={`lg:hidden fixed inset-0 z-[70] transition-all duration-300 ${open ? "pointer-events-auto" : "pointer-events-none invisible"}`}>
      <div className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`} onClick={handleDrawerClose} />
      <div
        className={`fixed top-0 right-0 h-full w-[155px] max-w-[44vw] flex flex-col overflow-hidden shadow-[-16px_0_40px_rgba(10,30,80,0.5)] transition-transform duration-300 ease-out bg-gradient-to-b from-[#0B2358]/95 via-[#0F2D6B]/95 to-[#071942]/98 backdrop-blur-2xl text-white border-l border-sky-400/30 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={dragX > 0 ? { transform: `translateX(${dragX}px)`, transition: isDragging.current ? "none" : undefined } : undefined}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-2.5 py-2.5 border-b border-sky-400/20 bg-white/10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-md bg-white/95 backdrop-blur-md p-0.5 flex items-center justify-center shadow-sm border border-white/80 shrink-0 overflow-hidden">
              <img src="/logo-mark.png" alt="HRM_OPS" className="w-full h-full object-contain block" />
            </div>
            <span className="text-[11px] font-bold tracking-wide text-white truncate">HRM_OPS</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleTheme} className="w-5 h-5 flex items-center justify-center rounded-md text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <i className={isDark ? "ri-sun-line text-[11px] text-amber-300" : "ri-moon-line text-[11px] text-sky-200"} />
            </button>
            <button onClick={handleDrawerClose} className="w-5 h-5 flex items-center justify-center rounded-md text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label="Close">
              <i className="ri-close-line text-xs" />
            </button>
          </div>
        </div>

        {/* Branch / BU Switcher */}
        <div className="px-2 py-1.5 border-b border-sky-400/20 bg-sky-950/40 text-[9.5px] text-sky-100">
          {isSuperAdmin || isHrDivision || (isBranchAdmin && visibleBranches.length > 1) ? (
            <div className="flex items-center gap-1">
              <i className="ri-building-line text-[#29ABE2] text-[10px] shrink-0" />
              <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="w-full rounded-md px-1 py-0.5 text-[9.5px] font-semibold bg-sky-900/60 text-white border border-sky-400/30 focus:outline-none cursor-pointer truncate">
                {visibleBranches.length === 0 && <option value="">No BU</option>}
                {visibleBranches.map((b) => (<option key={b.id} value={b.id}>{b.is_site ? `↳ ${b.name} (Site)` : b.name}</option>))}
              </select>
            </div>
          ) : userBranchName ? (
            <div className="flex items-center gap-1 font-medium text-sky-200 truncate">
              <i className="ri-building-line text-[#29ABE2] text-[10px] shrink-0" />
              <span className="truncate">{userBranchName}</span>
            </div>
          ) : null}
        </div>

        {/* Modules Navigation List */}
        <div className="flex-1 overflow-y-auto py-1.5 space-y-2 px-1">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-sky-300/80 px-1.5 mb-0.5 block">{group.label}</span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleDrawerClose}
                      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10.5px] font-medium transition-all ${
                        isActive
                          ? "bg-white/20 text-white font-bold border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_2px_8px_rgba(41,171,226,0.35)]"
                          : "text-sky-100/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <i className={`${item.icon} text-xs w-3 h-3 flex items-center justify-center shrink-0 ${isActive ? "text-[#29ABE2]" : "text-sky-300/80"}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer / In-Place Confirmation (Zero overlap) */}
        <div className="shrink-0 border-t border-sky-400/20 bg-sky-950/80 backdrop-blur-md px-2 py-2 min-h-[46px] flex items-center justify-center">
          {confirmLogout ? (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between w-full mb-1 px-0.5">
                <span className="text-[9.5px] font-bold text-rose-300 flex items-center gap-1">
                  <i className="ri-logout-box-r-line text-[10px]" /> Sign Out?
                </span>
                <button type="button" onClick={() => setConfirmLogout(false)} className="text-[9px] text-sky-300/70 hover:text-white cursor-pointer">
                  <i className="ri-close-line text-xs" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 w-full">
                <button type="button" onClick={() => setConfirmLogout(false)} className="flex-1 py-1 px-1 rounded-md border border-sky-400/30 bg-white/10 text-[9px] font-medium text-sky-100 hover:bg-white/20 transition-colors cursor-pointer text-center">
                  Cancel
                </button>
                <button type="button" onClick={() => { setConfirmLogout(false); onClose(); handleLogout(); }} className="flex-1 py-1 px-1 rounded-md bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-bold shadow-sm shadow-rose-950/50 hover:from-rose-600 hover:to-red-700 transition-all cursor-pointer text-center whitespace-nowrap">
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 w-full">
              <Link to="/profile" onClick={handleDrawerClose} className="flex items-center gap-1 min-w-0 flex-1 group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-5 h-5 rounded-md object-cover shrink-0 ring-1 ring-sky-300/40" />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-[#29ABE2] flex items-center justify-center text-white text-[8.5px] font-bold shrink-0">{initials}</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold truncate text-white group-hover:text-sky-300 transition-colors">{displayName}</p>
                  <p className="text-[8.5px] text-sky-300/70 truncate leading-tight">{displayContact}</p>
                </div>
              </Link>
              <button onClick={() => setConfirmLogout(true)} className="w-5 h-5 flex items-center justify-center rounded-md text-sky-200 hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-colors shrink-0" title="Sign out">
                <i className="ri-logout-box-r-line text-[11px]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MobileDrawer;
