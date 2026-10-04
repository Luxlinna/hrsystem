import { memo, useMemo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";
import { UserRowActions } from "./UserRowActions";

interface UserRowItemProps {
  user: UserAssignment;
  assignableRoles: AppRole[];
  isUnconfirmed: boolean;
  isSuperAdmin: boolean;
  invitingUserId: number | null;
  onUpdateUserRole: (user: UserAssignment, roleId: number | null) => void;
  onResendInvite: (user: UserAssignment) => void;
  onRemoveUser: (user: UserAssignment) => void;
  onOpenPhoneModal: (user: UserAssignment) => void;
}

export const UserRowItem = memo(function UserRowItem({
  user,
  assignableRoles,
  isUnconfirmed,
  isSuperAdmin,
  invitingUserId,
  onUpdateUserRole,
  onResendInvite,
  onRemoveUser,
  onOpenPhoneModal,
}: UserRowItemProps) {
  const isSuperUser = user.app_roles?.is_admin || user.app_roles?.name === "Super Admin";
  const canModifyUser = isSuperAdmin || !isSuperUser;
  const isPhoneUser = isPhoneSyntheticEmail(user.email);
  const hasConfirmedAccount = Boolean(user.user_id && !isUnconfirmed);
  const hasRoleAssigned = Boolean(user.role_id);
  const phoneDigits = isPhoneUser ? syntheticEmailToPhone(user.email) : "";
  const cleanPhoneFormatted = isPhoneUser ? formatDisplayPhone(phoneDigits) : "";
  const displayNameText = user.display_name || (isPhoneUser ? `Staff (${cleanPhoneFormatted})` : user.email);
  const initials = (user.display_name || phoneDigits || user.email || "U").slice(0, 2).toUpperCase();

  const { buRoles, siteRoles, globalRoles } = useMemo(() => {
    const userBranch = user.branch_id;
    const userSite = user.default_work_location_id;

    const relevant = assignableRoles.filter((r) => {
      if (user.role_id && r.id === user.role_id) return true;
      if (!r.branch_id && !r.work_location_id) return true;
      if (userBranch && r.branch_id === userBranch) {
        if (r.work_location_id) {
          return Boolean(userSite && r.work_location_id === userSite);
        }
        return true;
      }
      if (!userBranch && isSuperAdmin) return true;
      return false;
    });

    return {
      buRoles: relevant.filter((r) => Boolean(r.branch_id && !r.work_location_id)),
      siteRoles: relevant.filter((r) => Boolean(r.work_location_id)),
      globalRoles: relevant.filter((r) => !r.branch_id && !r.work_location_id),
    };
  }, [user.branch_id, user.default_work_location_id, user.role_id, assignableRoles, isSuperAdmin]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
      {/* User Info & Identity */}
      <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-blue-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-2xs">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{displayNameText}</p>
            {isSuperUser && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                Super Admin
              </span>
            )}
            <span className="text-[10px] font-medium text-[#253C7D] dark:text-sky-300 bg-blue-50/80 dark:bg-sky-950/60 border border-blue-100 dark:border-sky-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <i className="ri-building-line text-[9px]" />
              {user.branch_name || "Headquarters"}
            </span>
            {user.site_name && (
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <i className="ri-map-pin-2-line text-[9px]" />
                {user.site_name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
            {isPhoneUser ? (
              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-slate-200 font-semibold">
                <i className="ri-phone-fill text-[#253C7D] dark:text-sky-400 text-[11px]" />
                {cleanPhoneFormatted}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-600 dark:text-slate-300">
                <i className="ri-mail-line text-gray-400 dark:text-slate-500 text-[11px]" />
                {user.email}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* System Access / Account Status */}
      <div className="shrink-0">
        {hasConfirmedAccount && hasRoleAssigned ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs whitespace-nowrap">
            <i className="ri-checkbox-circle-fill text-emerald-500 dark:text-emerald-400 text-sm" />
            {isPhoneUser ? "Active (Phone Login)" : "Active"}
          </span>
        ) : hasConfirmedAccount && !hasRoleAssigned ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 shadow-2xs whitespace-nowrap">
            <i className="ri-alert-fill text-amber-500 dark:text-amber-400 text-sm" />
            Role Needed
          </span>
        ) : user.user_id && isUnconfirmed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs whitespace-nowrap">
            <i className="ri-time-line text-amber-500 dark:text-amber-400 text-sm" />
            Pending Invite
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 whitespace-nowrap">
            <i className="ri-close-circle-line text-gray-400 dark:text-slate-500 text-sm" />
            No Login Account
          </span>
        )}
      </div>

      {/* Role Selector & Actions */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {canModifyUser ? (
          <select
            value={user.role_id || ""}
            onChange={(e) => onUpdateUserRole(user, e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30 dark:focus:ring-sky-500/30 cursor-pointer shadow-2xs h-[34px] max-w-[210px]"
          >
            <option value="">No Role (No Access)</option>
            {buRoles.length > 0 && (
              <optgroup label={`${user.branch_name || "BU"} Roles`}>
                {buRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </optgroup>
            )}
            {siteRoles.length > 0 && (
              <optgroup label={`${user.site_name || "Site"} Roles`}>
                {siteRoles.map((role) => (
                  <option key={role.id} value={role.id}>↳ {role.name} (Site)</option>
                ))}
              </optgroup>
            )}
            {globalRoles.length > 0 && (
              <optgroup label="Global Roles">
                {globalRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        ) : (
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl">
            {user.app_roles?.name || "Super Admin"}
          </span>
        )}

        {canModifyUser && (
          <UserRowActions
            user={user}
            isUnconfirmed={isUnconfirmed}
            isPhoneUser={isPhoneUser}
            invitingUserId={invitingUserId}
            onResendInvite={onResendInvite}
            onOpenPhoneModal={onOpenPhoneModal}
            onRemoveUser={onRemoveUser}
          />
        )}
      </div>
    </div>
  );
});
