import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { useFCM } from "@/hooks/useFCM";
import { usePermissions, isBootstrapAdminEmail } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import GeofenceCheckInAlert from "@/components/GeofenceCheckInAlert";
import UrgentAnnouncementAlert from "@/components/UrgentAnnouncementAlert";

function NotInDirectoryScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC] p-6">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="ri-user-unfollow-line text-3xl text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Not Activated</h2>
        <p className="text-xs text-gray-500 leading-relaxed mb-6">
          Your account must first be added to the <strong>Employee Directory</strong> of your branch before you can access the system. Please contact your Branch Admin or HR to activate your profile.
        </p>
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full py-3 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function LayoutContent() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const { role, loading: permsLoading } = usePermissions();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useFCM();

  if (!permsLoading && !role && !isBootstrapAdminEmail(user?.email)) {
    return <NotInDirectoryScreen />;
  }

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
