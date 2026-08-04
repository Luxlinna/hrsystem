import { usePermissions } from "@/hooks/usePermissions";
import { getDashboardTier } from "@/lib/dashboardTier";
import CompanyDashboard from "./CompanyDashboard";
import SelfServiceHome from "./SelfServiceHome";

export default function Dashboard() {
  const { role, loading } = usePermissions();

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
