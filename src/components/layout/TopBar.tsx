/**
 * TopBar — thin orchestrator (~100 lines).
 *
 * All state, effects, and handlers live in useTopBar().
 * Each visual section is a memoized sub-component that only re-renders when
 * its own slice of props changes:
 *
 *   MobileDrawer          — mobile navigation drawer
 *   GlobalSearch          — search bar + results dropdown
 *   NotificationDropdown  — bell icon + notification panel
 *   ProfileDropdown       — avatar + profile menu
 *
 * Keyboard shortcut: Cmd+K / Ctrl+K focuses the search input.
 */
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useBranchScope } from "@/context/BranchContext";
import { useTopBar } from "./topbar/useTopBar";
import MobileDrawer        from "./topbar/MobileDrawer";
import GlobalSearch        from "./topbar/GlobalSearch";
import NotificationDropdown from "./topbar/NotificationDropdown";
import ProfileDropdown     from "./topbar/ProfileDropdown";

export default function TopBar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const {
    visibleBranches,
    selectedBranchId,
    setSelectedBranchId,
    userBranchName,
    isSuperAdmin,
  } = useBranchScope();

  const {
    user,
    displayName,
    avatarUrl,
    can,
    isAdmin,
    isBranchAdmin,
    canOpenRecycleBin,
    handleLogout,
    menuOpen, setMenuOpen,
    notifOpen, setNotifOpen,
    profileOpen, setProfileOpen,
    previewNotifs,
    unreadCount,
    openNotification,
    searchQuery, setSearchQuery,
    searchResults,
    searchOpen, setSearchOpen,
    searchLoading,
    handleSelectResult,
    clearSearch,
  } = useTopBar();

  // ── Cmd+K / Ctrl+K → focus search ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (searchContainerRef.current as any)?.__focusSearch?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const textColor = "text-gray-600 hover:text-gray-900";

  return (
    <>
      {/* Mobile drawer — rendered outside <header> for correct z-layer stacking */}
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        displayName={displayName}
        avatarUrl={avatarUrl}
        userEmail={user?.email}
        handleLogout={handleLogout}
        can={can}
        isAdmin={isAdmin}
        isBranchAdmin={isBranchAdmin}
        canOpenRecycleBin={canOpenRecycleBin}
      />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="flex items-center justify-between px-4 lg:px-8 py-3">

          {/* Left — hamburger + desktop nav links */}
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-black/5 cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
            >
              <i className="ri-menu-line text-lg text-gray-700" />
            </button>

            <nav className="hidden md:flex items-center gap-5" aria-label="Primary">
              {can("employees") && (
                <Link to="/employees" className={`text-[13px] font-medium ${textColor} transition-colors`}>
                  Directory
                </Link>
              )}
              {can("branches") && (
                <Link to="/branches" className={`text-[13px] font-medium ${textColor} transition-colors`}>
                  Branches
                </Link>
              )}
              {can("analytics") && (
                <Link to="/analytics" className={`text-[13px] font-medium ${textColor} transition-colors`}>
                  Analytics
                </Link>
              )}
            </nav>
          </div>

          {/* Centre — global search */}
          <div ref={searchContainerRef} className="flex-1 min-w-0">
            <GlobalSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              searchOpen={searchOpen}
              setSearchOpen={setSearchOpen}
              searchLoading={searchLoading}
              onSelectResult={handleSelectResult}
              onClear={clearSearch}
            />
          </div>

          {/* Right — branch switcher/indicator, theme toggle, notifications, profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Branch/Site Switcher */}
            {(isSuperAdmin || (isBranchAdmin && visibleBranches.length > 1)) ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-colors shadow-2xs">
                <i className="ri-building-line text-[#253C7D] text-sm" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
                  title="Select branch or site"
                >
                  {visibleBranches.length === 0 && <option value="">No Branches</option>}
                  {visibleBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Branch Admin / Employee Branch Badge */
              userBranchName && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 rounded-xl text-[11px] font-bold">
                  <i className="ri-map-pin-2-fill text-xs text-[#253C7D]" />
                  <span className="max-w-[130px] truncate" title={`Branch: ${userBranchName}`}>{userBranchName}</span>
                </div>
              )
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 transition-all cursor-pointer flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark
                ? <i className="ri-sun-line text-lg text-amber-400 transition-transform duration-300 hover:rotate-45" />
                : <i className="ri-moon-line text-lg text-slate-700 hover:text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
              }
            </button>

            <NotificationDropdown
              open={notifOpen}
              onOpenChange={setNotifOpen}
              previewNotifs={previewNotifs}
              unreadCount={unreadCount}
              onOpen={openNotification}
            />

            <ProfileDropdown
              open={profileOpen}
              onOpenChange={setProfileOpen}
              displayName={displayName}
              avatarUrl={avatarUrl}
              userEmail={user?.email}
              can={can}
              isAdmin={isAdmin}
              isBranchAdmin={isBranchAdmin}
              canOpenRecycleBin={canOpenRecycleBin}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      </header>
    </>
  );
}
