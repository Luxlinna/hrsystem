import { Link, useLocation } from "react-router-dom";
import { useState, useCallback } from "react";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { isBootstrapAdminEmail, usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useTheme } from "@/context/ThemeContext";

const navGroups = [
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
      { path: "/meeting-rooms", label: "Meeting Rooms", icon: "ri-door-open-line", module: "meeting-rooms" },
      { path: "/tasks", label: "Tasks", icon: "ri-checkbox-multiple-line", module: "tasks" },
      { path: "/hire", label: "Hire", icon: "ri-briefcase-line", module: "hire" },
      { path: "/offboard", label: "Off Board", icon: "ri-user-unfollow-line", module: "offboard" },
      { path: "/org-chart", label: "Org Chart", icon: "ri-organization-chart", module: "org-chart" },
      { path: "/performance", label: "Performance", icon: "ri-star-line", module: "performance" },
      { path: "/attendance", label: "Attendance", icon: "ri-fingerprint-line", module: "attendance" },
      { path: "/training", label: "Training", icon: "ri-graduation-cap-line", module: "training" },
      { path: "/disciplinary", label: "Disciplinary", icon: "ri-alert-line", module: "disciplinary" },
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
      { path: "/settings", label: "Settings", icon: "ri-settings-3-line", module: "settings" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { user } = useAuth();
  const { can, isAdmin, role } = usePermissions();
  const { employee: myEmployee } = useMyEmployee();
  const canOpenAdminPortal = isAdmin || isBootstrapAdminEmail(user?.email);
  const canOpenRecycleBin = canOpenAdminPortal || /manager/i.test(role?.name || "");
  const [hovered, setHovered] = useState(false);
  const { unreadCount } = useUnreadNotifications();

  const { isDark, toggleTheme } = useTheme();
  const visibleGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => can(item.module)) }))
    .filter((group) => group.items.length > 0);

  const isExpanded = !collapsed || hovered;
  // Prefer the real HR employee record over Supabase Auth's user_metadata,
  // which can drift independently (e.g. an invite flow that stored a role
  // title as display_name instead of the person's actual name).
  const displayName =
    (myEmployee && `${myEmployee.first_name} ${myEmployee.last_name}`.trim()) ||
    (user?.user_metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "HR Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = myEmployee?.avatar_url || (user?.user_metadata?.avatar_url as string | undefined);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  // Every color below branches on isDark — previously the toggle button
  // changed its own icon but the sidebar's background/text stayed hardcoded
  // dark regardless of theme, so "Light Mode" never actually applied here.
  const activeClass = isDark ? "bg-[#29ABE2]/20 text-[#29ABE2]" : "bg-[#253C7D]/10 text-[#253C7D] font-semibold";
  const inactiveClass = isDark ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
  const tooltipClass = "absolute left-full ml-3 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg border border-gray-700";
  const borderClass = isDark ? "border-white/10" : "border-gray-200";

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isDark ? "bg-[#1A1A1A]" : `bg-white border-r ${borderClass} shadow-sm`
      } ${isExpanded ? "w-[260px]" : "w-[64px]"}`}
    >
      {/* Logo */}
      <div className={`flex items-center shrink-0 transition-all duration-300 ${isExpanded ? "justify-start px-5 pt-6 pb-4" : "justify-center pt-5 pb-3"}`}>
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo-mark.png"
            alt="HRM_OPS Logo"
            className="w-8 h-8 object-contain shrink-0"
          />
          {isExpanded && (
            <span className={`text-[13px] font-serif font-semibold tracking-wide whitespace-nowrap ${isDark ? "text-white" : "text-gray-900"}`}>
              HRM_OPS
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-5 min-h-0">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {isExpanded && (
              <span className={`text-[10px] font-medium uppercase tracking-wider px-5 mb-1.5 block ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {group.label}
              </span>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                      isExpanded ? "gap-3 px-3 py-2.5 mx-3" : "justify-center py-3 mx-2"
                    } ${isActive ? activeClass : inactiveClass}`}
                  >
                    <i className={`${item.icon} text-lg w-5 h-5 flex items-center justify-center shrink-0`} />
                    {isExpanded && (
                      <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                    )}
                    {!isExpanded && <span className={tooltipClass}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notifications */}
        {can("notifications") && (
          <div className={`${isExpanded ? "mx-3" : "mx-2"}`}>
            <Link
              to="/notifications"
              className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-3"
              } ${location.pathname === "/notifications" ? activeClass : inactiveClass}`}
            >
              <div className="relative">
                <i className="ri-notification-3-line text-lg w-5 h-5 flex items-center justify-center shrink-0" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              {isExpanded && <span className="text-[13px] whitespace-nowrap">Notifications</span>}
              {!isExpanded && <span className={tooltipClass}>Notifications</span>}
            </Link>
          </div>
        )}

        {/* Admin Portal — Super Admins only */}
        {canOpenAdminPortal && (
          <div className={`${isExpanded ? "mx-3" : "mx-2"}`}>
            <Link
              to="/admin"
              className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-3"
              } ${location.pathname === "/admin" ? activeClass : inactiveClass}`}
            >
              <i className="ri-admin-line text-lg w-5 h-5 flex items-center justify-center shrink-0" />
              {isExpanded && <span className="text-[13px] whitespace-nowrap">Admin Portal</span>}
              {!isExpanded && <span className={tooltipClass}>Admin Portal</span>}
            </Link>
          </div>
        )}

        {/* Recycle Bin — Super Admins only */}
        {canOpenRecycleBin && (
          <div className={`${isExpanded ? "mx-3" : "mx-2"}`}>
            <Link
              to="/recycle-bin"
              className={`flex items-center rounded-lg transition-all duration-200 group relative ${
                isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-3"
              } ${location.pathname === "/recycle-bin" ? activeClass : inactiveClass}`}
            >
              <i className="ri-delete-bin-6-line text-lg w-5 h-5 flex items-center justify-center shrink-0" />
              {isExpanded && <span className="text-[13px] whitespace-nowrap">Recycle Bin</span>}
              {!isExpanded && <span className={tooltipClass}>Recycle Bin</span>}
            </Link>
          </div>
        )}
      </div>

      {/* User */}
      <div className={`shrink-0 border-t ${borderClass} px-3 py-4`}>
        <Link
          to="/profile"
          className={`flex items-center gap-3 rounded-lg transition-all duration-200 p-1.5 -m-1.5 ${isExpanded ? "px-2" : "justify-center"} ${
            isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className={`w-9 h-9 rounded-lg object-cover shrink-0 border ${borderClass}`} />
          ) : (
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0 border ${
                isDark ? "bg-white/10 text-white border-white/10" : "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/15"
              }`}
            >
              {initials}
            </div>
          )}
          {isExpanded && (
            <div className="min-w-0">
              <p className={`text-[13px] font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{displayName}</p>
              {role?.name ? (
                <span
                  className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-full ${
                    isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {role.name}
                </span>
              ) : (
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Theme toggle & Sidebar Collapse */}
      <div className={`shrink-0 flex items-center justify-between border-t ${borderClass} px-3 py-2`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
            isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          } ${!isExpanded ? "w-full justify-center" : ""}`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <i className="ri-sun-line text-lg text-amber-400" />
          ) : (
            <i className="ri-moon-line text-lg text-gray-500" />
          )}
          {isExpanded && <span className="text-[12px] font-medium">{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        {isExpanded && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`${collapsed ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line"} text-lg`} />
          </button>
        )}
      </div>
    </aside>
  );
}
