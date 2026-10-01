import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { getDashboardTier } from "@/lib/dashboardTier";
import CompanyDashboard from "./CompanyDashboard";
import SelfServiceHome from "./SelfServiceHome";

export default function Dashboard() {
  const { role, loading } = usePermissions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If on mobile/phone screen (< 1024px) and view is not explicitly set to dashboard,
    // default to "My Attendance" first when opening the web on phone.
    const isMobile = window.innerWidth < 1024;
    const forceDashboard = searchParams.get("view") === "dashboard";
    if (isMobile && !forceDashboard) {
      navigate("/self-service?tab=attendance", { replace: true });
    }
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tier = getDashboardTier(role);
  return tier === "self_service" ? <SelfServiceHome /> : <CompanyDashboard />;
}
