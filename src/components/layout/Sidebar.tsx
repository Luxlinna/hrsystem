import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/context/AuthContext";

const navGroups = [
  {
    label: "Core",
    items: [
      { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
      { path: "/employees", label: "Directory", icon: "ri-user-search-line" },
      { path: "/branches", label: "Branches", icon: "ri-building-line" },
      { path: "/analytics", label: "Analytics", icon: "ri-bar-chart-2-line" },
    ],
  },
  {
    label: "Workforce",
    items: [
      { path: "/onboarding", label: "Onboarding", icon: "ri-user-add-line" },
      { path: "/onboarding-checklist", label: "Checklists", icon: "ri-task-line" },
      { path: "/leave", label: "Leave", icon: "ri-calendar-event-line" },
      { path: "/leave-calendar", label: "Leave Calendar", icon: "ri-calendar-2-line" },
      { path: "/shifts", label: "Shifts", icon: "ri-calendar-schedule-line" },
      { path: "/hire", label: "Hire", icon: "ri-briefcase-line" },
      { path: "/offboard", label: "Off Board", icon: "ri-user-unfollow-line" },
      { path: "/org-chart", label: "Org Chart", icon: "ri-organization-chart" },
      { path: "/performance", label: "Performance", icon: "ri-star-line" },
      { path: "/attendance", label: "Attendance", icon: "ri-fingerprint-line" },
      { path: "/training", label: "Training", icon: "ri-graduation-cap-line" },
      { path: "/disciplinary", label: "Disciplinary", icon: "ri-alert-line" },
    ],
  },
  {
    label: "Operations",
    items: [
      { path: "/payroll-module", label: "Payroll", icon: "ri-money-dollar-circle-line" },
      { path: "/payroll-approval", label: "Pay Approval", icon: "ri-file-check-line" },
      { path: "/finance", label: "Finance", icon: "ri-bank-line" },
      { path: "/it-management", label: "IT", icon: "ri-computer-line" },
      { path: "/benefits", label: "Benefits", icon: "ri-heart-pulse-line" },
      { path: "/tools", label: "Tools", icon: "ri-tools-line" },
      { path: "/announcements", label: "Announcements", icon: "ri-megaphone-line" },
      { path: "/documents", label: "Documents", icon: "ri-folder-line" },
    ],
  },
  {
    label: "Insights",
    items: [
      { path: "/reports", label: "Reports", icon: "ri-file-chart-line" },
      { path: "/audit-log", label: "Audit Log", icon: "ri-shield-check-line" },
      { path: "/self-service", label: "Self-Service", icon: "ri-user-settings-line" },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/unity-apps", label: "Unity", icon: "ri-apps-line" },
      { path: "/settings", label: "Settings", icon: "ri-settings-3-line" },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isExpanded = !collapsed || hovered;
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "HR Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));

    const channel = supabase
      .channel("sidebar-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => setUnreadCount((c) => c + 1)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const old = payload.old as { is_read: boolean };
          const row = payload.new as { is_read: boolean };
          if (!old.is_read && row.is_read) setUnreadCount((c) => Math.max(0, c - 1));
          else if (old.is_read && !row.is_read) setUnreadCount((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const old = payload.old as { is_read: boolean };
          if (!old.is_read) setUnreadCount((c) => Math.max(0, c - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hidden lg:flex flex-col h-screen bg-[#1A1A1A] fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-[260px]" : "w-[64px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center shrink-0 transition-all duration-300 ${isExpanded ? "justify-start px-5 pt-6 pb-4" : "justify-center pt-5 pb-3"}`}>
        <Link to="/" className="flex items-center gap-2">
          <img
            src="https://public.readdy.ai/ai/img_res/40fc7162-7c19-4969-b0c2-8981511d8064.png"
            alt="HRMS Logo"
            className="w-8 h-8 object-contain shrink-0"
          />
          {isExpanded && (
            <span className="text-[13px] font-serif font-semibold text-white tracking-wide whitespace-nowrap">
              HR Nexus
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-5 min-h-0">
        {navGroups.map((group) => (
          <div key={group.label}>
            {isExpanded && (
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider px-5 mb-1.5 block">
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
                    } ${
                      isActive
                        ? "bg-[#0D7377]/20 text-[#0D7377]"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <i className={`${item.icon} text-lg w-5 h-5 flex items-center justify-center shrink-0`} />
                    {isExpanded && (
                      <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                    )}
                    {!isExpanded && (
                      <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg border border-gray-700">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Notifications */}
        <div className={`${isExpanded ? "mx-3" : "mx-2"}`}>
          <Link
            to="/notifications"
            className={`flex items-center rounded-lg transition-all duration-200 group relative ${
              isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-3"
            } ${
              location.pathname === "/notifications"
                ? "bg-[#0D7377]/20 text-[#0D7377]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
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
            {!isExpanded && (
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-800 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg border border-gray-700">
                Notifications
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="shrink-0 border-t border-white/10 px-3 py-4">
        <Link
          to="/settings"
          className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${isExpanded ? "px-2" : "justify-center"}`}
        >
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white text-[12px] font-bold shrink-0 border border-white/10">
            {initials}
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Collapse toggle at bottom */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="shrink-0 flex items-center justify-center py-3 border-t border-white/10 text-gray-500 hover:text-white transition-colors"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i className={`${collapsed ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line"} text-lg`} />
      </button>
    </aside>
  );
}