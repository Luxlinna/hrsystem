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
      activeIcon: "ri-fingerprint-fill",
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

  const handleOpenMore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("toggle-mobile-drawer"));
  };

  return (
    <div className="lg:hidden fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <nav
        className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 bg-gradient-to-r from-[#0B2358]/85 via-[#143987]/90 to-[#0D2866]/85 backdrop-blur-2xl border border-sky-300/30 shadow-[0_16px_36px_rgba(10,32,85,0.45),0_0_24px_rgba(41,171,226,0.2)] rounded-full px-2.5 py-1.5 transition-all"
        role="navigation"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            aria-label={item.label}
            title={item.label}
            className={`flex items-center justify-center transition-all duration-300 active:scale-80 ${
              item.isActive
                ? "bg-white/25 text-white border border-white/35 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 shadow-[inset_0_1px_4px_rgba(255,255,255,0.35),0_2px_10px_rgba(41,171,226,0.3)] scale-105"
                : "text-sky-100/70 hover:text-white p-2 sm:p-2.5 rounded-full hover:bg-white/10"
            }`}
          >
            <i className={`${item.isActive ? item.activeIcon : item.icon} text-lg sm:text-xl leading-none transition-transform duration-200`} />
          </Link>
        ))}

        {/* More / All Modules Drawer Button */}
        <button
          type="button"
          onClick={handleOpenMore}
          aria-label="More Apps & Modules"
          title="More Apps & Modules"
          className="flex items-center justify-center text-sky-100/70 hover:text-white p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-80 transition-all duration-200 cursor-pointer"
        >
          <i className="ri-apps-2-line text-lg sm:text-xl leading-none" />
        </button>
      </nav>
    </div>
  );
}
