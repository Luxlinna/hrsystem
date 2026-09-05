import { memo, useState } from "react";
import type { AppRole, UserAssignment } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";
import { createPhoneUserAccount } from "../api";

interface UsersTableProps {
  displayedUsers: UserAssignment[];
  assignableRoles: AppRole[];
  unconfirmedEmails: Set<string>;
  invitingUserId: number | null;
  isSuperAdmin: boolean;
  searchQuery: string;
  filterBranch: string;
  onUpdateUserRole: (user: UserAssignment, roleId: number | null) => void;
  onResendInvite: (user: UserAssignment) => void;
  onRemoveUser: (user: UserAssignment) => void;
}

export const UsersTable = memo(function UsersTable({
  displayedUsers,
  assignableRoles,
  unconfirmedEmails,
  invitingUserId,
  isSuperAdmin,
  searchQuery,
  filterBranch,
  onUpdateUserRole,
  onResendInvite,
  onRemoveUser,
}: UsersTableProps) {
  const [phoneModalUser, setPhoneModalUser] = useState<UserAssignment | null>(null);
  const [newPhonePassword, setNewPhonePassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenPhoneModal = (user: UserAssignment) => {
    setPhoneModalUser(user);
    setNewPhonePassword("");
    setShowModalPassword(false);
    setModalError(null);
    setModalSuccess(false);
    setCopied(false);
  };

  const handleGenerateModalPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Staff#${rand}`;
    setNewPhonePassword(generated);
    setShowModalPassword(true);
    setModalError(null);
  };

  const handleSavePhonePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneModalUser) return;
    const phone = syntheticEmailToPhone(phoneModalUser.email);
    if (!phone) {
      setModalError("Could not determine phone number.");
      return;
    }
    if (newPhonePassword.length < 6) {
      setModalError("Password must be at least 6 characters.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    try {
      const { res, result } = await createPhoneUserAccount({
        phone,
        password: newPhonePassword,
        displayName: phoneModalUser.display_name || `Staff ${phone}`,
        roleId: phoneModalUser.role_id || null,
      });

      if (!res.ok || result.error) {
        setModalError(result.error || "Failed to update phone user password.");
      } else {
        setModalSuccess(true);
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to update password.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!phoneModalUser) return;
    const phone = syntheticEmailToPhone(phoneModalUser.email);
    const text = `Hello ${phoneModalUser.display_name || "Staff"},\n\nYour HR System login details:\nPhone: ${phone}\nPassword: ${newPhonePassword}\n\nPlease sign in at the login page using your phone number and password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (displayedUsers.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-6 text-center">
          <i className="ri-team-line text-4xl mb-2 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No users found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery || filterBranch !== "all"
              ? "Try clearing your branch filter or search query."
              : 'Click "Add User" to provision a new user account.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
        <div className="divide-y divide-gray-50">
          {displayedUsers.map((user) => {
            const isUnconfirmed = unconfirmedEmails.has(user.email?.toLowerCase() ?? "");
            const isSuperUser = user.app_roles?.is_admin || user.app_roles?.name === "Super Admin";
            const canModifyUser = isSuperAdmin || !isSuperUser;
            const isPhoneUser = isPhoneSyntheticEmail(user.email);
            const hasConfirmedAccount = Boolean(user.user_id && !isUnconfirmed);
            const hasRoleAssigned = Boolean(user.role_id);

            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* User Info & Identity */}
                <div className="flex items-center gap-3.5 min-w-[240px] flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-blue-600 flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-2xs">
                    {(user.display_name || user.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.display_name || user.email}
                      </p>
                      {isSuperUser && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Super Admin
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-[#253C7D] bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="ri-building-line text-[9px]" />
                        {user.branch_name || "Headquarters"}
                      </span>
                      {user.site_name && (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <i className="ri-map-pin-2-line text-[9px]" />
                          {user.site_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {isPhoneUser ? (
                        <span className="inline-flex items-center gap-1 text-gray-700 font-semibold">
                          <i className="ri-phone-fill text-[#253C7D] text-[11px]" />
                          {syntheticEmailToPhone(user.email)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          <i className="ri-mail-line text-gray-400 text-[11px]" />
                          {user.email}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* System Access / Account Status */}
                <div className="shrink-0">
                  {hasConfirmedAccount && hasRoleAssigned ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap"
                      title="Account confirmed and active — user can log in and use this system"
                    >
                      <i className="ri-checkbox-circle-fill text-emerald-500 text-sm" />
                      {isPhoneUser ? "Active (Phone Login)" : "Active"}
                    </span>
                  ) : hasConfirmedAccount && !hasRoleAssigned ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs whitespace-nowrap"
                      title="Account created, but no role assigned yet. Assign a role to enable system access."
                    >
                      <i className="ri-alert-fill text-amber-500 text-sm" />
                      Role Needed
                    </span>
                  ) : user.user_id && isUnconfirmed ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs whitespace-nowrap"
                      title="Invitation link sent via email — awaiting employee confirmation"
                    >
                      <i className="ri-time-line text-amber-500 text-sm" />
                      Pending Invite
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap"
                      title="No login account exists yet for this user assignment"
                    >
                      <i className="ri-close-circle-line text-gray-400 text-sm" />
                      No Login Account
                    </span>
                  )}
                </div>

                {/* Role Selector & Actions */}
                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  {canModifyUser ? (
                    <select
                      value={user.role_id || ""}
                      onChange={(e) =>
                        onUpdateUserRole(user, e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30 cursor-pointer shadow-2xs h-[34px]"
                    >
                      <option value="">No Role (No Access)</option>
                      {assignableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-gray-500 px-3 py-1.5 bg-gray-100 rounded-xl">
                      {user.app_roles?.name || "Super Admin"}
                    </span>
                  )}

                  {/* Phone user password reset / setup button */}
                  {canModifyUser && isPhoneUser && (
                    <button
                      type="button"
                      onClick={() => handleOpenPhoneModal(user)}
                      title="Reset or set phone account password"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#253C7D] transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <i className="ri-key-2-line text-base" />
                    </button>
                  )}

                  {/* Email resend invite button */}
                  {canModifyUser && !isPhoneUser && (
                    <button
                      type="button"
                      onClick={() => onResendInvite(user)}
                      disabled={invitingUserId === user.id}
                      title={
                        isUnconfirmed
                          ? "Resend invitation email link"
                          : "User already confirmed their account"
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-2xs"
                    >
                      <i
                        className={`ri-${
                          invitingUserId === user.id
                            ? "loader-4-line animate-spin"
                            : isUnconfirmed
                            ? "mail-send-line"
                            : "mail-check-line"
                        } text-base`}
                      />
                    </button>
                  )}

                  {/* Remove user button */}
                  {canModifyUser && (
                    <button
                      type="button"
                      onClick={() => onRemoveUser(user)}
                      title="Remove user assignment"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer shrink-0 transition-colors shadow-2xs"
                    >
                      <i className="ri-delete-bin-line text-base" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Password Reset Modal for Phone Accounts */}
      {phoneModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#253C7D]/5 to-indigo-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shadow-md shadow-[#253C7D]/20">
                  <i className="ri-key-2-line text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">
                    {modalSuccess ? "Password Updated!" : "Phone User Password"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {phoneModalUser.display_name || syntheticEmailToPhone(phoneModalUser.email)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhoneModalUser(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {modalSuccess ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                  <i className="ri-checkbox-circle-fill text-emerald-600 text-xl shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold text-sm text-emerald-950 mb-0.5">
                      Password Successfully Saved
                    </p>
                    <p>
                      <strong>{phoneModalUser.display_name || "Staff"}</strong> can now log in using this password.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {syntheticEmailToPhone(phoneModalUser.email)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-gray-500">New Password:</span>
                    <span className="font-mono font-bold text-[#253C7D]">
                      {newPhonePassword}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-[#253C7D] text-white hover:bg-[#1d3066]"
                  }`}
                >
                  <i className={copied ? "ri-check-double-line text-sm" : "ri-file-copy-line text-sm"} />
                  <span>{copied ? "Copied to Clipboard!" : "Copy Login Info to Share"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhoneModalUser(null)}
                  className="w-full py-2.5 px-4 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePhonePassword} className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {phoneModalUser.display_name || "Staff Member"}
                    </p>
                    <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                      <i className="ri-phone-line text-gray-400" />
                      <span className="font-semibold">{syntheticEmailToPhone(phoneModalUser.email)}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#253C7D] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    {phoneModalUser.branch_name || "Headquarters"}
                  </span>
                </div>

                {modalError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <i className="ri-error-warning-line text-sm shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Set New Password *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateModalPassword}
                      className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ri-magic-line text-xs" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showModalPassword ? "text" : "password"}
                      value={newPhonePassword}
                      onChange={(e) => setNewPhonePassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowModalPassword(!showModalPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className={showModalPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPhoneModalUser(null)}
                    disabled={modalSubmitting}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting || newPhonePassword.length < 6}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1d3066] rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {modalSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-sm" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-shield-keyhole-line text-sm" />
                        <span>Save Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
});
