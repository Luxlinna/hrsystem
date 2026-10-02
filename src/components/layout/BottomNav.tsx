import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard?view=dashboard", label: "Home", icon: "ri-home-5-line", activeIcon: "ri-home-5-fill" },
  { path: "/leave", label: "My Leave", icon: "ri-calendar-line", activeIcon: "ri-calendar-fill" },
  { path: "/self-service?tab=attendance", label: "My Attendance", icon: "ri-fingerprint-line", activeIcon: "ri-fingerprint-line" },
  { path: "/payroll-module", label: "My Payroll", icon: "ri-wallet-3-line", activeIcon: "ri-wallet-3-fill" },
  { path: "/meeting-rooms", label: "Meeting Rooms", icon: "ri-external-link-line", activeIcon: "ri-external-link-line" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 transition-colors"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map((item) => {
          const isAttendance = item.label === "My Attendance";
          const isHome = item.label === "Home";
          const isActive = isAttendance
            ? location.pathname.startsWith("/self-service") || location.pathname.startsWith("/attendance")
            : isHome
            ? location.pathname.startsWith("/dashboard")
            : location.pathname.startsWith(item.path.split("?")[0]);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all"
            >
              {/* Pill Container */}
              <div
                className={`w-12 h-7 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-[#F0EFFF] dark:bg-indigo-950/70 text-[#523CDD] dark:text-indigo-400 font-bold"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <i className={`${isActive ? item.activeIcon : item.icon} text-lg leading-none`} />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] leading-none tracking-tight whitespace-nowrap ${
                  isActive
                    ? "text-[#523CDD] dark:text-indigo-400 font-bold"
                    : "text-slate-400 dark:text-slate-500 font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
