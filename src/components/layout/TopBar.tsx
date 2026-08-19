import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/context/ThemeContext";
import { getNotificationTarget } from "@/lib/notificationRoutes";
import { toast } from "@/components/Toast";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  source: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  path: string;
  category: string;
}

const moduleResults: SearchResult[] = [
  { id: "m-dashboard", label: "Dashboard", sublabel: "Main overview", icon: "ri-dashboard-line", path: "/", category: "Module" },
  { id: "m-employees", label: "Employee Directory", sublabel: "Browse all staff", icon: "ri-user-search-line", path: "/employees", category: "Module" },
  { id: "m-branches", label: "Branch Management", sublabel: "10 branches", icon: "ri-building-line", path: "/branches", category: "Module" },
  { id: "m-analytics", label: "Analytics", sublabel: "Charts & insights", icon: "ri-bar-chart-2-line", path: "/analytics", category: "Module" },
  { id: "m-onboarding", label: "Onboarding", sublabel: "New hire pipeline", icon: "ri-user-add-line", path: "/onboarding", category: "Module" },
  { id: "m-checklist", label: "Onboarding Checklist", sublabel: "Task assignments", icon: "ri-task-line", path: "/onboarding-checklist", category: "Module" },
  { id: "m-leave", label: "Leave Requests", sublabel: "Approve / reject", icon: "ri-calendar-event-line", path: "/leave", category: "Module" },
  { id: "m-leave-cal", label: "Leave Calendar", sublabel: "Team availability", icon: "ri-calendar-2-line", path: "/leave-calendar", category: "Module" },
  { id: "m-hire", label: "Hire / Recruitment", sublabel: "Candidates & jobs", icon: "ri-briefcase-line", path: "/hire", category: "Module" },
  { id: "m-offboard", label: "Offboarding", sublabel: "Exit workflows", icon: "ri-user-unfollow-line", path: "/offboard", category: "Module" },
  { id: "m-orgchart", label: "Org Chart", sublabel: "Reporting structure", icon: "ri-organization-chart", path: "/org-chart", category: "Module" },
  { id: "m-payroll", label: "Payroll", sublabel: "Monthly payroll", icon: "ri-money-dollar-circle-line", path: "/payroll-module", category: "Module" },
  { id: "m-payapproval", label: "Payroll Approval", sublabel: "Review & approve runs", icon: "ri-file-check-line", path: "/payroll-approval", category: "Module" },
  { id: "m-finance", label: "Finance", sublabel: "Expense tracking", icon: "ri-bank-line", path: "/finance", category: "Module" },
  { id: "m-it", label: "IT Management", sublabel: "Assets & tickets", icon: "ri-computer-line", path: "/it-management", category: "Module" },
  { id: "m-benefits", label: "Benefits", sublabel: "Plans & enrollment", icon: "ri-heart-pulse-line", path: "/benefits", category: "Module" },
  { id: "m-tools", label: "HR Tools", sublabel: "Productivity tools", icon: "ri-tools-line", path: "/tools", category: "Module" },
  { id: "m-reports", label: "Reports & Export", sublabel: "CSV / PDF reports", icon: "ri-file-chart-line", path: "/reports", category: "Module" },
  { id: "m-audit", label: "Audit Log", sublabel: "Activity history", icon: "ri-shield-check-line", path: "/audit-log", category: "Module" },
  { id: "m-selfservice", label: "Self-Service Portal", sublabel: "Employee view", icon: "ri-user-settings-line", path: "/self-service", category: "Module" },
  { id: "m-unity", label: "Unity Apps", sublabel: "Integrations hub", icon: "ri-apps-line", path: "/unity-apps", category: "Module" },
  { id: "m-settings", label: "Settings", sublabel: "System configuration", icon: "ri-settings-3-line", path: "/settings", category: "Module" },
  { id: "m-notifications", label: "Notifications", sublabel: "Alerts & updates", icon: "ri-notification-3-line", path: "/notifications", category: "Module" },
  { id: "m-meeting-rooms", label: "Meeting Rooms", sublabel: "Book a room", icon: "ri-door-open-line", path: "/meeting-rooms", category: "Module" },
  { id: "m-tasks", label: "Tasks", sublabel: "Track and assign work", icon: "ri-checkbox-multiple-line", path: "/tasks", category: "Module" },
];

// module keys mirror ALL_MODULES in src/pages/admin/page.tsx; paths that
// don't map 1:1 (e.g. /payroll-module → "payroll") are listed explicitly.
const PATH_MODULE_OVERRIDES: Record<string, string> = { "/": "dashboard", "/payroll-module": "payroll" };
function pathToModule(path: string): string {
  return PATH_MODULE_OVERRIDES[path] || path.slice(1);
}

// ── Mobile Drawer with swipe-to-dismiss ──
function MobileDrawer({
  open,
  onClose,
  location,
  displayName,
  user,
  handleLogout,
  can,
  isAdmin,
  canOpenRecycleBin,
}: {
  open: boolean;
  onClose: () => void;
  location: ReturnType<typeof useLocation>;
  displayName: string;
  user: any;
  handleLogout: () => void;
  can: (module: string) => boolean;
  isAdmin: boolean;
  canOpenRecycleBin: boolean;
}) {
  const { isDark, toggleTheme } = useTheme();
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);

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
    // Only allow swipe left (negative dx)
    if (dx < 0) {
      setDragX(dx);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const dx = touchCurrentX.current - touchStartX.current;
    if (dx < -80) {
      onClose();
    }
    setDragX(0);
  };

  const DRAWER_GROUPS = [
    {
      label: "Core",
      items: [
        { path: "/", label: "Dashboard", icon: "ri-dashboard-line", module: "dashboard" },
        { path: "/employees", label: "Directory", icon: "ri-user-search-line", module: "employees" },
        { path: "/branches", label: "Branches", icon: "ri-building-line", module: "branches" },
        { path: "/analytics", label: "Analytics", icon: "ri-bar-chart-2-line", module: "analytics" },
      ],
    },
    {
      label: "Workforce",
      items: [
        { path: "/onboarding", label: "Onboarding", icon: "ri-user-add-line", module: "onboarding" },
        { path: "/onboarding-checklist", label: "Checklists", icon: "ri-task-line", module: "onboarding-checklist" },
        { path: "/leave", label: "Leave", icon: "ri-calendar-event-line", module: "leave" },
        { path: "/leave-calendar", label: "Leave Calendar", icon: "ri-calendar-2-line", module: "leave-calendar" },
        { path: "/shifts", label: "Shifts", icon: "ri-calendar-schedule-line", module: "shifts" },
        { path: "/hire", label: "Hire", icon: "ri-briefcase-line", module: "hire" },
        { path: "/offboard", label: "Off Board", icon: "ri-user-unfollow-line", module: "offboard" },
        { path: "/org-chart", label: "Org Chart", icon: "ri-organization-chart", module: "org-chart" },
        { path: "/performance", label: "Performance", icon: "ri-star-line", module: "performance" },
        { path: "/attendance", label: "Attendance", icon: "ri-fingerprint-line", module: "attendance" },
        { path: "/training", label: "Training", icon: "ri-graduation-cap-line", module: "training" },
        { path: "/disciplinary", label: "Disciplinary", icon: "ri-alert-line", module: "disciplinary" },
        { path: "/meeting-rooms", label: "Meeting Rooms", icon: "ri-door-open-line", module: "meeting-rooms" },
        { path: "/tasks", label: "Tasks", icon: "ri-checkbox-multiple-line", module: "tasks" },
      ],
    },
    {
      label: "Operations",
      items: [
        { path: "/payroll-module", label: "Payroll", icon: "ri-money-dollar-circle-line", module: "payroll" },
        { path: "/payroll-approval", label: "Pay Approval", icon: "ri-file-check-line", module: "payroll-approval" },
        { path: "/finance", label: "Finance", icon: "ri-bank-line", module: "finance" },
        { path: "/it-management", label: "IT", icon: "ri-computer-line", module: "it-management" },
        { path: "/benefits", label: "Benefits", icon: "ri-heart-pulse-line", module: "benefits" },
        { path: "/tools", label: "Tools", icon: "ri-tools-line", module: "tools" },
        { path: "/announcements", label: "Announcements", icon: "ri-megaphone-line", module: "announcements" },
        { path: "/documents", label: "Documents", icon: "ri-folder-line", module: "documents" },
      ],
    },
    {
      label: "Insights",
      items: [
        { path: "/reports", label: "Reports", icon: "ri-file-chart-line", module: "reports" },
        { path: "/audit-log", label: "Audit Log", icon: "ri-shield-check-line", module: "audit-log" },
        { path: "/self-service", label: "Self-Service", icon: "ri-user-settings-line", module: "self-service" },
      ],
    },
    {
      label: "System",
      items: [
        { path: "/notifications", label: "Notifications", icon: "ri-notification-3-line", module: "notifications" },
        { path: "/unity-apps", label: "Unity", icon: "ri-apps-line", module: "unity-apps" },
        { path: "/settings", label: "Settings", icon: "ri-settings-3-line", module: "settings" },
      ],
    },
  ];

  const visibleDrawerGroups = DRAWER_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => can(item.module)) }))
    .filter((group) => group.items.length > 0);

  if (isAdmin || canOpenRecycleBin) {
    visibleDrawerGroups.push({
      label: "Admin",
      items: [
        { path: "/recycle-bin", label: "Recycle Bin", icon: "ri-delete-bin-6-line", module: "admin" },
        ...(isAdmin ? [{ path: "/admin", label: "Admin Portal", icon: "ri-admin-line", module: "admin" }] : []),
      ],
    });
  }

  if (!open) return null;

  return (
    <>
      <div
        className="lg:hidden fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
      />
      <div
        className="lg:hidden fixed top-0 left-0 h-full w-72 bg-[#1A1A1A] z-[70] flex flex-col overflow-hidden transition-transform duration-150"
        style={{ transform: `translateX(${Math.min(0, dragX)}px)`, opacity: dragX < 0 ? Math.max(0.5, 1 + dragX / 288) : 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/logo-mark.png"
              alt="HRM_OPS"
              className="w-7 h-7 object-contain"
            />
            <span className="text-[13px] font-semibold text-white tracking-wide">HRM_OPS</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 cursor-pointer transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <i className="ri-sun-line text-lg text-amber-400" />
              ) : (
                <i className="ri-moon-line text-lg text-gray-300" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="px-5 pt-2 pb-0.5 flex items-center gap-1.5">
          <i className="ri-arrow-left-s-line text-gray-600 text-xs" />
          <span className="text-[10px] text-gray-600">Swipe left to close</span>
        </div>

        {/* Drawer nav */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {visibleDrawerGroups.map((group) => (
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

        {/* Drawer user footer */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-3 min-w-0 flex-1">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={displayName} className="w-9 h-9 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                  {displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
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
}

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can, isAdmin, role } = usePermissions();
  const canOpenRecycleBin = isAdmin || /manager/i.test(role?.name || "");
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const query = q.trim().toLowerCase();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);
    const [empRes, candRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(5),
      supabase
        .from("candidates")
        .select("id, full_name, email, stage, job_postings(title)")
        .is("deleted_at", null)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(4),
    ]);

    const results: SearchResult[] = [];

    (empRes.data || []).forEach((e: any) => {
      results.push({
        id: `emp-${e.id}`,
        label: `${e.first_name} ${e.last_name}`,
        sublabel: `${e.role} · ${e.department}`,
        icon: "ri-user-line",
        path: `/employees/${e.id}`,
        category: "Employee",
      });
    });

    (candRes.data || []).forEach((c: any) => {
      results.push({
        id: `cand-${c.id}`,
        label: c.full_name,
        sublabel: `${c.job_postings?.title || "Candidate"} · ${c.stage}`,
        icon: "ri-briefcase-line",
        path: `/hire/candidate/${c.id}`,
        category: "Candidate",
      });
    });

    const matchedModules = moduleResults.filter(
      (m) =>
        can(pathToModule(m.path)) &&
        (m.label.toLowerCase().includes(query) || m.sublabel.toLowerCase().includes(query))
    ).slice(0, 4);
    results.push(...matchedModules);

    setSearchResults(results);
    setSearchOpen(results.length > 0);
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 280);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.path);
    setSearchQuery("");
    setSearchOpen(false);
    setSearchFocused(false);
  };

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setNotifs(data || []));

    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));

    const channel = supabase
      .channel("topbar-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          setNotifs((prev) => [row, ...prev].slice(0, 6));
          setUnreadCount((c) => c + 1);
          toast(row.title, row.message, row.type);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          const old = payload.old as NotificationRow;
          setNotifs((prev) => prev.map((n) => (n.id === row.id ? row : n)));
          if (!old.is_read && row.is_read) setUnreadCount((c) => Math.max(0, c - 1));
          else if (old.is_read && !row.is_read) setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const old = payload.old as NotificationRow;
          setNotifs((prev) => prev.filter((n) => n.id !== old.id));
          if (!old.is_read) setUnreadCount((c) => Math.max(0, c - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const openNotification = (n: NotificationRow) => {
    if (!n.is_read) markRead(n.id);
    setNotifOpen(false);
    const target = getNotificationTarget(n.source, n.entity_id);
    if (target && can(target.module)) navigate(target.path);
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  const textColor = "text-gray-600 hover:text-gray-900";
  const iconColor = "text-gray-700";
  const bgClass = "bg-white/80 backdrop-blur-md border-b border-gray-100";

  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "HR Admin";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
    {/* Mobile drawer rendered outside header (above it in DOM order = correct z layering) */}
    <MobileDrawer
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      location={location}
      displayName={displayName}
      user={user}
      handleLogout={handleLogout}
      can={can}
      isAdmin={isAdmin}
      canOpenRecycleBin={canOpenRecycleBin}
    />
    <header className={`sticky top-0 z-40 ${bgClass} transition-all duration-300`}>
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-black/5 cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className={`ri-menu-line text-lg ${iconColor}`} />
          </button>

          <nav className="hidden md:flex items-center gap-5">
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

        {/* Global Search */}
        <div className="flex-1 max-w-xs lg:max-w-md mx-4" ref={searchRef}>
          <div className="relative">
            <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
              searchFocused ? "text-[#253C7D]" : "text-gray-400"
            } pointer-events-none`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search employees, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { setSearchFocused(true); if (searchResults.length > 0) setSearchOpen(true); }}
              className="w-full pl-9 pr-9 py-2 rounded-lg text-[12px] transition-all outline-none bg-gray-100 text-gray-700 placeholder:text-gray-400 border border-transparent focus:bg-white focus:border-[#253C7D]/30"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchOpen(false); searchInputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}

            {/* Dropdown Results */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden z-50 max-h-[380px] overflow-y-auto" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                {["Employee", "Candidate", "Module"].map((category) => {
                  const catResults = searchResults.filter((r) => r.category === category);
                  if (catResults.length === 0) return null;
                  return (
                    <div key={category}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{category}s</span>
                      </div>
                      {catResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleSelectResult(result)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#253C7D]/5 transition-colors text-left cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center shrink-0">
                            <i className={`${result.icon} text-[#253C7D] text-sm w-4 h-4 flex items-center justify-center`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{result.label}</p>
                            <p className="text-[11px] text-gray-500 truncate">{result.sublabel}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] text-gray-400">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              </div>
            )}

            {searchOpen && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 p-5 text-center z-50" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
                <i className="ri-search-line text-2xl text-gray-300 mb-2 block" />
                <p className="text-[12px] text-gray-500">No results for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sun / Moon Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer text-gray-700 dark:text-amber-400 flex items-center justify-center"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <i className="ri-sun-line text-lg text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <i className="ri-moon-line text-lg text-slate-700 hover:text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className={`p-2 rounded-full hover:bg-black/5 transition-colors relative cursor-pointer ${iconColor}`}
            >
              <i className="ri-notification-3-line text-lg" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
                  <Link to="/notifications" className="text-[11px] text-[#253C7D] font-medium" onClick={() => setNotifOpen(false)}>
                    View All
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${
                        !n.is_read ? "bg-[#253C7D]/5" : ""
                      }`}
                    >
                      <p className="text-[12px] font-semibold text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#253C7D] flex items-center justify-center text-white text-[12px] font-bold">
                  {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="hidden md:block text-[13px] font-medium text-gray-700">
                {displayName}
              </span>
              <i className={`ri-arrow-down-s-line text-sm ${iconColor}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900">{displayName}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-user-line text-sm text-gray-400" />
                    My Profile
                  </Link>
                  {can("settings") && (
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-settings-3-line text-sm text-gray-400" />
                      Settings
                    </Link>
                  )}
                  {(isAdmin || canOpenRecycleBin) && (
                    <>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="ri-admin-line text-sm text-gray-400" />
                          Admin Portal
                        </Link>
                      )}
                      <Link
                        to="/recycle-bin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="ri-delete-bin-6-line text-sm text-gray-400" />
                        Recycle Bin
                      </Link>
                    </>
                  )}
                  {can("analytics") && (
                    <Link
                      to="/analytics"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="ri-bar-chart-2-line text-sm text-gray-400" />
                      Analytics
                    </Link>
                  )}
                </div>
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                  >
                    <i className="ri-logout-box-r-line text-sm" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
