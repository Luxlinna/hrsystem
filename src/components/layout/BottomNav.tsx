import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export default function BottomNav() {
  const location = useLocation();
  const { can } = usePermissions();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab");

  const NAV_ITEMS = [
    {
      id: "home",
      path: can("dashboard") ? "/dashboard" : "/self-service",
      label: "Home",
      icon: "ri-home-5-line",
      activeIcon: "ri-home-5-fill",
      visible: true,
      isActive: location.pathname.startsWith("/dashboard") || (location.pathname === "/self-service" && !currentTab),
    },
    {
      id: "leave",
      path: can("leave") ? "/leave" : "/self-service?tab=leave",
      label: "My Leave",
      icon: "ri-calendar-line",
      activeIcon: "ri-calendar-fill",
      visible: true,
      isActive: location.pathname.startsWith("/leave") || (location.pathname === "/self-service" && currentTab === "leave"),
    },
    {
      id: "attendance",
      path: "/self-service?tab=attendance",
      label: "My Attendance",
      icon: "ri-fingerprint-line",
      activeIcon: "ri-fingerprint-line",
      visible: true,
      isActive: location.pathname === "/self-service" && currentTab === "attendance",
    },
    {
      id: "payroll",
      path: can("payroll") ? "/payroll-module" : "/self-service?tab=payslips",
      label: "My Payroll",
      icon: "ri-wallet-3-line",
      activeIcon: "ri-wallet-3-fill",
      visible: true,
      isActive: location.pathname.startsWith("/payroll") || (location.pathname === "/self-service" && currentTab === "payslips"),
    },
    {
      id: "meeting-rooms",
      path: "/meeting-rooms",
      label: "Meeting Rooms",
      icon: "ri-external-link-line",
      activeIcon: "ri-external-link-line",
      visible: can("meeting-rooms"),
      isActive: location.pathname.startsWith("/meeting-rooms"),
    },
  ].filter((item) => item.visible);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 transition-colors"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
          >
            {/* Pill Container */}
            <div
              className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
                item.isActive
                  ? "bg-[#EEF3FA] dark:bg-indigo-950/70 text-[#253C7D] dark:text-sky-400 font-bold"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <i className={`${item.isActive ? item.activeIcon : item.icon} text-lg leading-none`} />
            </div>

            {/* Label */}
            <span
              className={`text-[10px] leading-none tracking-tight whitespace-nowrap ${
                item.isActive
                  ? "text-[#253C7D] dark:text-sky-400 font-bold"
                  : "text-slate-400 dark:text-slate-500 font-medium"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
