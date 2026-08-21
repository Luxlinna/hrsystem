import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "ri-home-5-line", activeIcon: "ri-home-5-fill" },
  { path: "/leave", label: "Leave", icon: "ri-calendar-event-line", activeIcon: "ri-calendar-event-fill" },
  { path: "/employees", label: "People", icon: "ri-user-search-line", activeIcon: "ri-user-search-fill" },
  { path: "/notifications", label: "Alerts", icon: "ri-notification-3-line", activeIcon: "ri-notification-3-fill" },
  { path: "/self-service", label: "Me", icon: "ri-user-settings-line", activeIcon: "ri-user-settings-fill" },
];

export default function BottomNav() {
  const location = useLocation();
  const { unreadCount } = useUnreadNotifications();
  const [pulsing, setPulsing] = useState(false);
  const prevCountRef = useRef(0);

  // Pulse the badge whenever the shared count climbs.
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 3000);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          const isNotif = item.path === "/notifications";
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${
                isActive ? "text-[#253C7D]" : "text-gray-400"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#253C7D] rounded-full" />
              )}
              {/* Icon wrapper */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <i className={`${isActive ? item.activeIcon : item.icon} text-xl leading-none`} />
                {/* Badge for notifications */}
                {isNotif && unreadCount > 0 && (
                  <>
                    {pulsing && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-400 animate-ping" />
                    )}
                    <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-none ${isActive ? "text-[#253C7D]" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
