import { memo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { RolePermissionMatrix } from "./RolePermissionMatrix";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface RolesTabProps {
  roles: AppRole[];
  users: UserAssignment[];
  branches?: BranchOption[];
  filterBranch?: string;
  setFilterBranch?: (branchId: string) => void;
  userBranchId?: string | null;
  userBranchName?: string | null;
  isSuperAdmin?: boolean;
  canManageRoles?: boolean;
  onOpenNewRole: (categoryKey?: string) => void;
  onOpenEditRole: (role: AppRole) => void;
  onCloneRole?: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
  onNavigateToUsers?: (roleName?: string) => void;
  showToast?: (msg: string, type?: "ok" | "err") => void;
}

export const RolesTab = memo(function RolesTab({
  roles = [],
  users = [],
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onCloneRole,
  onDeleteRole,
  onNavigateToUsers,
  showToast,
}: RolesTabProps) {
  return (
    <div className="space-y-4">
      <RolePermissionMatrix
        roles={roles}
        users={users}
        canManageRoles={canManageRoles}
        onOpenNewRole={onOpenNewRole}
        onOpenEditRole={onOpenEditRole}
        onCloneRole={onCloneRole}
        onDeleteRole={onDeleteRole}
        onNavigateToUsers={onNavigateToUsers}
        showToast={showToast}
      />
    </div>
  );
});
