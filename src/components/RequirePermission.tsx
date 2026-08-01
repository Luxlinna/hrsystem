import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F7] p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="ri-lock-line text-3xl text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
    </div>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = usePermissions();

  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <AccessDenied message="You don't have permission to access the admin portal." />;
  return <>{children}</>;
}

export function RequireModule({ module, children }: { module: string; children: ReactNode }) {
  const { can, loading } = usePermissions();

  if (loading) return <LoadingScreen />;
  if (!can(module)) return <AccessDenied message="You don't have permission to access this module. Ask an admin to grant it in the Admin Portal." />;
  return <>{children}</>;
}
