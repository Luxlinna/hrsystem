import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const { role, loading: permLoading } = usePermissions();

  if (authLoading || (user && permLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated in Supabase Auth but has NO account/role in User Management
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-xs">
            <i className="ri-user-unfollow-line text-3xl" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your account (<span className="font-semibold text-slate-800 dark:text-slate-200">{user.email || "Employee"}</span>) is not registered or has no active role assigned in <strong>User Management</strong>.
            </p>
            <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
              Please contact your HR Administrator or System Administrator to grant access.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <i className="ri-logout-box-r-line text-sm" />
              <span>Sign Out / Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}