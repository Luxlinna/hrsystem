import { memo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { ALL_MODULES } from "../constants";

interface RolesTabProps {
  roles: AppRole[];
  users: UserAssignment[];
  onOpenNewRole: () => void;
  onOpenEditRole: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
}

export const RolesTab = memo(function RolesTab({
  roles,
  users,
  onOpenNewRole,
  onOpenEditRole,
  onDeleteRole,
}: RolesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{roles.length} roles defined</p>
        <button
          onClick={onOpenNewRole}
          className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white rounded-xl text-sm hover:bg-[#1F336A] transition-colors cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line" />
          New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: role.color + "20" }}>
                  <i className={`${role.is_admin ? "ri-shield-star-line" : "ri-shield-user-line"} text-lg`} style={{ color: role.color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{role.name}</p>
                  {role.is_admin ? (
                    <span className="text-[10px] font-semibold text-[#253C7D] bg-[#253C7D]/10 px-2 py-0.5 rounded-full">Full Access</span>
                  ) : (
                    <span className="text-[11px] text-gray-400">{role.allowed_modules.length} modules</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onOpenEditRole(role)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <i className="ri-edit-line text-sm" />
                </button>
                <button
                  onClick={() => onDeleteRole(role.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            </div>
            {role.description && (
              <p className="text-xs text-gray-500 mb-3">{role.description}</p>
            )}
            {!role.is_admin && role.allowed_modules.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {role.allowed_modules.slice(0, 6).map((m) => {
                  const mod = ALL_MODULES.find((x) => x.key === m);
                  return mod ? (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                      <i className={`${mod.icon} text-[9px]`} />
                      {mod.label}
                    </span>
                  ) : null;
                })}
                {role.allowed_modules.length > 6 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{role.allowed_modules.length - 6} more</span>
                )}
              </div>
            )}
            {/* User count with this role */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
              <i className="ri-user-line text-gray-400 text-xs" />
              <span className="text-[11px] text-gray-400">
                {users.filter((u) => u.role_id === role.id).length} user{users.filter((u) => u.role_id === role.id).length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
