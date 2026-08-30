import { memo } from "react";

interface AdminHeaderProps {
  isSuperAdmin: boolean;
  userBranchName: string | null;
}

export const AdminHeader = memo(function AdminHeader({
  isSuperAdmin,
  userBranchName,
}: AdminHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#253C7D] rounded-xl flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-admin-line text-white text-lg" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {isSuperAdmin ? "Super Admin Portal" : "Branch Admin Portal"}
            </h1>
            {!isSuperAdmin && userBranchName && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 flex items-center gap-1">
                <i className="ri-map-pin-2-fill text-xs" />
                {userBranchName}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isSuperAdmin
              ? "Manage organizational roles, system permissions, and user accounts across all branches"
              : `Manage and invite staff accounts, assign roles, and review password resets for ${userBranchName || "your branch"}`}
          </p>
        </div>
      </div>
    </div>
  );
});
