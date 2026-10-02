import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useTopBar } from "./topbar/useTopBar";
import MobileDrawer from "./topbar/MobileDrawer";
import GlobalSearch from "./topbar/GlobalSearch";
import NotificationDropdown from "./topbar/NotificationDropdown";
import ProfileDropdown from "./topbar/ProfileDropdown";

export default function TopBar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleToggle = () => setMenuOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-drawer", handleToggle);
    return () => window.removeEventListener("toggle-mobile-drawer", handleToggle);
  }, [setMenuOpen]);

  const textColor = "text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white";

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

      <header
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3">

          {/* Left — Mobile Brand & Desktop Nav Links */}
          <div className="flex items-center gap-3">
            {/* Mobile Brand */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#253C7D] p-1 flex items-center justify-center shadow-2xs">
                <img src="/logo-mark.png" alt="HRSystem" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                HRSystem
              </span>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-5" aria-label="Primary">
              {can("employees") && (
                <Link to="/employees" className={`text-[13px] font-medium ${textColor} transition-colors`}>
                  Directory
                </Link>
              )}
              {can("analytics") && (
                <Link to="/analytics" className={`text-[13px] font-medium ${textColor} transition-colors`}>
                  Analytics
                </Link>
              )}
            </nav>
          </div>

          {/* Centre — global search (Desktop only) */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 min-w-0">
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

          {/* Right — theme toggle, notifications, profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
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
