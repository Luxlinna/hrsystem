import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { RoomGeometricIcon } from "@/components/icons/RoomGeometricIcon";

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
      label: "Rooms",
      icon: "ri-community-line",
      activeIcon: "ri-community-fill",
      visible: can("meeting-rooms"),
      isActive: location.pathname.startsWith("/meeting-rooms"),
    },
  ].filter((item) => item.visible);

  const handleOpenMore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("toggle-mobile-drawer"));
  };

  return (
    <div className="lg:hidden fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <nav
        className="pointer-events-auto flex items-center gap-2 sm:gap-3.5 bg-gradient-to-r from-[#0B2358]/90 via-[#143987]/95 to-[#0D2866]/90 backdrop-blur-2xl border border-sky-300/40 shadow-[0_20px_40px_rgba(10,32,85,0.5),0_0_28px_rgba(41,171,226,0.25)] rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 transition-all"
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
                ? "bg-white/25 text-white border border-white/40 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 shadow-[inset_0_1px_4px_rgba(255,255,255,0.4),0_2px_12px_rgba(41,171,226,0.35)] scale-105"
                : "text-sky-100/75 hover:text-white p-2.5 sm:p-3 rounded-full hover:bg-white/10"
            }`}
          >
            {item.id === "meeting-rooms" ? (
              <RoomGeometricIcon className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px]" />
            ) : (
              <i className={`${item.isActive ? item.activeIcon : item.icon} text-[22px] sm:text-[24px] leading-none transition-transform duration-200`} />
            )}
          </Link>
        ))}

        {/* More / All Modules Drawer Button */}
        <button
          type="button"
          onClick={handleOpenMore}
          aria-label="More Apps & Modules"
          title="More Apps & Modules"
          className="flex items-center justify-center text-sky-100/75 hover:text-white p-2.5 sm:p-3 rounded-full hover:bg-white/10 active:scale-80 transition-all duration-200 cursor-pointer"
        >
          <i className="ri-apps-2-line text-[22px] sm:text-[24px] leading-none" />
        </button>
      </nav>
    </div>
  );
}
