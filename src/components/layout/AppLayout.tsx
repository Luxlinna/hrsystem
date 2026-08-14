import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { useFCM } from "@/hooks/useFCM";
import GeofenceCheckInAlert from "@/components/GeofenceCheckInAlert";
import UrgentAnnouncementAlert from "@/components/UrgentAnnouncementAlert";

function LayoutContent() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { collapsed } = useSidebar();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useFCM();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 260) }}
      >
        <TopBar />
        <main className="flex-1 min-w-0 pb-16 lg:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <GeofenceCheckInAlert />
      <UrgentAnnouncementAlert />
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
