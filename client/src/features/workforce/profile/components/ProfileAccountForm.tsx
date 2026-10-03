import { useState, useEffect, memo } from "react";
import type { MyEmployee } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";
import { ProfilePasswordForm } from "./ProfilePasswordForm";

interface Props {
  displayName: string;
  setDisplayName: (name: string) => void;
  savingName: boolean;
  onSaveName: (payload?: { firstName?: string; lastName?: string; username?: string; email?: string; timezone?: string; }) => void;
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
  savingName,
  onSaveName,
  email,
  employee,
  newPassword = "",
  setNewPassword,
  confirmPassword = "",
  setConfirmPassword,
  savingPassword = false,
  onChangePassword,
  userRole,
  isSuperAdmin = false,
}: Props) {
  const [subTab, setSubTab] = useState<"personal_info" | "change_password">("personal_info");
  const [firstName, setFirstName] = useState(employee?.first_name || "");
  const [lastName, setLastName] = useState(employee?.last_name || "");
  const [username, setUsername] = useState(employee?.employee_code || "1");
  const [userEmail, setUserEmail] = useState(email || "");
  const [timezone, setTimezone] = useState("(UTC+07:00) Bangkok, Hanoi, Jakarta");

  useEffect(() => {
    if (employee?.first_name !== undefined) setFirstName(employee.first_name || "");
    if (employee?.last_name !== undefined) setLastName(employee.last_name || "");
    if (employee?.employee_code !== undefined) setUsername(employee.employee_code || "");
    if (email) setUserEmail(email);
  }, [employee, email]);

  const handleSave = () => {
    onSaveName({ firstName, lastName, username, email: isSuperAdmin ? userEmail : undefined, timezone: isSuperAdmin ? timezone : undefined });
  };

  const handleDiscard = () => {
    setFirstName(employee?.first_name || "");
    setLastName(employee?.last_name || "");
    setUsername(employee?.employee_code || "1");
    setUserEmail(email || "");
  };

  const roleName = typeof userRole === "string" ? userRole : (userRole as any)?.name;
  const accountType = roleName || (employee ? "Employee" : "User");
  const isPhone = isPhoneSyntheticEmail(userEmail);
  const displayContact = isPhone ? formatDisplayPhone(syntheticEmailToPhone(userEmail)) : userEmail;

  return (
    <div className="w-full">
      {/* Sub Tabs Segmented Control */}
      <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl inline-flex gap-1 mb-5">
        {[
          { id: "personal_info", label: "Personal Info", icon: "ri-user-line" },
          { id: "change_password", label: "Change Password", icon: "ri-lock-password-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              subTab === tab.id
                ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <i className={`${tab.icon} text-xs`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {subTab === "personal_info" ? (
        <div className="space-y-4 max-w-2xl text-xs">
          {/* Account Type Card */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <i className="ri-shield-user-line text-sm" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Type & Roles</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white tracking-wide shadow-2xs">
              {accountType}
            </span>
          </div>

          {/* First Name & Last Name in 2-Col Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { label: "First Name", val: firstName, set: setFirstName },
              { label: "Last Name", val: lastName, set: setLastName },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">{f.label}</label>
                <div className="relative">
                  <i className="ri-user-3-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Username */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Username / Employee Code</label>
            <div className="relative">
              <i className="ri-id-card-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs"
              />
            </div>
          </div>

          {/* Contact / Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{isPhone ? "Phone Number" : "Email Address"}</label>
              {!isSuperAdmin && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium inline-flex items-center gap-1"><i className="ri-lock-line text-[10px]" /> Read Only</span>}
            </div>
            <div className="relative">
              <i className={`${isPhone ? "ri-phone-line" : "ri-mail-line"} absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs`} />
              <input
                type="text"
                value={displayContact}
                disabled={!isSuperAdmin}
                readOnly={!isSuperAdmin}
                onChange={(e) => setUserEmail(e.target.value)}
                className={`w-full pl-8 pr-3.5 py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none shadow-2xs ${
                  !isSuperAdmin ? "bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#253C7D]"
                }`}
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Timezone</label>
              {!isSuperAdmin && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium inline-flex items-center gap-1"><i className="ri-lock-line text-[10px]" /> Read Only</span>}
            </div>
            <div className="relative">
              <i className="ri-global-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <select
                value={timezone}
                disabled={!isSuperAdmin}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full pl-8 pr-3.5 py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none shadow-2xs ${
                  !isSuperAdmin ? "bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#253C7D] cursor-pointer"
                }`}
              >
                <option value="(UTC+07:00) Bangkok, Hanoi, Jakarta">(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                <option value="(UTC+08:00) Singapore, Kuala Lumpur">(UTC+08:00) Singapore, Kuala Lumpur</option>
                <option value="(UTC+00:00) UTC / London">(UTC+00:00) UTC / London</option>
                <option value="(UTC-05:00) Eastern Time (US & Canada)">(UTC-05:00) Eastern Time (US & Canada)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={savingName}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1E3064] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <i className="ri-save-line text-xs" />
              <span>{savingName ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <i className="ri-close-line text-xs" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      ) : (
        <ProfilePasswordForm
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          savingPassword={savingPassword}
          onChangePassword={onChangePassword}
        />
      )}
    </div>
  );
});
