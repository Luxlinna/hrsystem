import { useState, useEffect, memo } from "react";
import type { MyEmployee } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface ProfileAccountFormProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  savingName: boolean;
  onSaveName: (payload?: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    timezone?: string;
  }) => void;
  email?: string;
  employee: MyEmployee | null;
  phone: string;
  setPhone: (phone: string) => void;
  savingPhone: boolean;
  onSavePhone: () => void;
  newPassword?: string;
  setNewPassword?: (p: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (p: string) => void;
  savingPassword?: boolean;
  onChangePassword?: () => void;
  userRole?: string | null;
  isSuperAdmin?: boolean;
}

export const ProfileAccountForm = memo(function ProfileAccountForm({
  displayName,
  setDisplayName,
  savingName,
  onSaveName,
  email,
  employee,
  phone,
  setPhone,
  savingPhone,
  onSavePhone,
  newPassword = "",
  setNewPassword,
  confirmPassword = "",
  setConfirmPassword,
  savingPassword = false,
  onChangePassword,
  userRole,
  isSuperAdmin = false,
}: ProfileAccountFormProps) {
  const [subTab, setSubTab] = useState<"personal_info" | "change_password">("personal_info");

  const [firstName, setFirstName] = useState(employee?.first_name || "");
  const [lastName, setLastName] = useState(employee?.last_name || "");
  const [username, setUsername] = useState(employee?.employee_code || "1");
  const [useEmail, setUseEmail] = useState(true);
  const [userEmail, setUserEmail] = useState(email || "");
  const [timezone, setTimezone] = useState("(UTC+07:00) Bangkok, Hanoi, Jakarta");

  useEffect(() => {
    if (employee?.first_name !== undefined) setFirstName(employee.first_name || "");
    if (employee?.last_name !== undefined) setLastName(employee.last_name || "");
    if (employee?.employee_code !== undefined) setUsername(employee.employee_code || "");
    if (email) setUserEmail(email);
  }, [employee, email]);

  const handleSave = () => {
    onSaveName({
      firstName,
      lastName,
      username,
      email: isSuperAdmin ? userEmail : undefined,
      timezone: isSuperAdmin ? timezone : undefined,
    });
  };

  const handleDiscard = () => {
    setFirstName(employee?.first_name || "");
    setLastName(employee?.last_name || "");
    setUsername(employee?.employee_code || "1");
    setUserEmail(email || "");
  };

  // Derive role safely
  const roleName = typeof userRole === "string" ? userRole : (userRole as any)?.name;
  const roles: string[] = roleName ? [roleName] : ["Employee"];
  const accountType = roleName || (employee ? "Employee" : "User");

  return (
    <div className="w-full">
      {/* Sub Tabs: Personal Info | Change password matching Reference */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSubTab("personal_info")}
          className={`pb-2.5 text-xs font-semibold transition-all cursor-pointer relative ${
            subTab === "personal_info"
              ? "text-[#253C7D] dark:text-sky-400 border-b-2 border-[#253C7D] dark:border-sky-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          Personal Info
        </button>

        <button
          type="button"
          onClick={() => setSubTab("change_password")}
          className={`pb-2.5 text-xs font-semibold transition-all cursor-pointer relative ${
            subTab === "change_password"
              ? "text-[#253C7D] dark:text-sky-400 border-b-2 border-[#253C7D] dark:border-sky-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          Change password
        </button>
      </div>

      {subTab === "personal_info" ? (
        <div className="space-y-4 max-w-4xl text-xs">
          {/* 1. Account Type */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Account Type
            </label>
            <div>
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] ${
                accountType === "Super Admin" ? "bg-[#253C7D] text-white" : "bg-[#20c997] text-white"
              }`}>
                {accountType}
              </span>
            </div>
          </div>

          {/* 2. First Name */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#f0f4f8] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* 3. Last Name */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#f0f4f8] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* 4. Username */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* 5. Use Email Checkbox */}
          <div className="pt-1">
            <label className={`inline-flex items-center gap-2 text-xs ${!isSuperAdmin ? "text-slate-400 dark:text-slate-500 cursor-not-allowed" : "text-slate-700 dark:text-slate-300 cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={useEmail}
                disabled={!isSuperAdmin}
                onChange={(e) => setUseEmail(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              />
              <span>Use Email</span>
            </label>
          </div>

          {/* 6. Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Email
              </label>
              {!isSuperAdmin && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  (Super Admin only)
                </span>
              )}
            </div>
            <input
              type="email"
              value={userEmail}
              disabled={!isSuperAdmin}
              readOnly={!isSuperAdmin}
              onChange={(e) => setUserEmail(e.target.value)}
              className={`w-full px-3 py-1.5 rounded text-xs transition-colors focus:outline-none ${
                !isSuperAdmin
                  ? "bg-[#f0f4f8] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#253C7D]"
              }`}
            />
          </div>

          {/* 7. Timezone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-normal text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              {!isSuperAdmin && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  (Super Admin only)
                </span>
              )}
            </div>
            <select
              value={timezone}
              disabled={!isSuperAdmin}
              onChange={(e) => setTimezone(e.target.value)}
              className={`w-full px-3 py-1.5 rounded text-xs transition-colors focus:outline-none ${
                !isSuperAdmin
                  ? "bg-[#f0f4f8] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#253C7D] cursor-pointer"
              }`}
            >
              <option value="(UTC+07:00) Bangkok, Hanoi, Jakarta">
                (UTC+07:00) Bangkok, Hanoi, Jakarta
              </option>
              <option value="(UTC+08:00) Singapore, Kuala Lumpur">
                (UTC+08:00) Singapore, Kuala Lumpur
              </option>
              <option value="(UTC+00:00) UTC / London">
                (UTC+00:00) UTC / London
              </option>
              <option value="(UTC-05:00) Eastern Time (US & Canada)">
                (UTC-05:00) Eastern Time (US & Canada)
              </option>
            </select>
          </div>

          {/* 8. Roles */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1.5">
              Roles
            </label>
            <div className="flex items-center gap-1.5">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] bg-[#20c997] text-white"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-2 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={savingName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5b9bd5] hover:bg-[#4a8ac4] text-white text-xs font-medium rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="ri-save-line text-xs" />
              <span>{savingName ? "Saving..." : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded shadow-xs transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xs" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      ) : (
        /* Change Password Sub-tab */
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (onChangePassword) onChangePassword();
          }}
          className="space-y-4 max-w-sm text-xs"
        >
          {/* Hidden dummy input to catch stubborn browser autofill */}
          <input type="text" name="prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="off" />

          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              New password
            </label>
            <input
              type="password"
              name="new_account_password"
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword && setNewPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              name="confirm_new_account_password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword && setConfirmPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5b9bd5] hover:bg-[#4a8ac4] text-white text-xs font-medium rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="ri-save-line text-xs" />
              <span>{savingPassword ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
});
