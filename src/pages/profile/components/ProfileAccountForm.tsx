import { useState, useEffect, memo } from "react";
import type { MyEmployee } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface ProfileAccountFormProps {
  displayName: string;
  setDisplayName: (name: string) => void;
  savingName: boolean;
  onSaveName: () => void;
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
}: ProfileAccountFormProps) {
  const [subTab, setSubTab] = useState<"personal_info" | "change_password">("personal_info");

  const [firstName, setFirstName] = useState(employee?.first_name || "");
  const [lastName, setLastName] = useState(employee?.last_name || "");
  const [username, setUsername] = useState(employee?.employee_code || "1");
  const [useEmail, setUseEmail] = useState(true);
  const [userEmail, setUserEmail] = useState(email || "");
  const [timezone, setTimezone] = useState("(UTC+07:00) Bangkok, Hanoi, Jakarta");

  useEffect(() => {
    if (employee?.first_name) setFirstName(employee.first_name);
    if (employee?.last_name) setLastName(employee.last_name);
    if (employee?.employee_code) setUsername(employee.employee_code);
    if (email) setUserEmail(email);
  }, [employee, email]);

  const handleSave = () => {
    const combined = `${firstName} ${lastName}`.trim();
    if (combined && combined !== displayName) {
      setDisplayName(combined);
    }
    onSaveName();
  };

  const handleDiscard = () => {
    setFirstName(employee?.first_name || "");
    setLastName(employee?.last_name || "");
    setUsername(employee?.employee_code || "1");
    setUserEmail(email || "");
  };

  // Derive roles list safely
  const roleName = typeof userRole === "string" ? userRole : (userRole as any)?.name;
  const roles: string[] = (
    roleName
      ? [roleName, "HR Manager"]
      : ["Admin", "HR Manager"]
  ).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="w-full">
      {/* Sub Tabs: Personal Info | Change password matching Reference */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6">
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
              <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] bg-[#20c997] text-white">
                Employee
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
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useEmail}
                onChange={(e) => setUseEmail(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <span>Use Email</span>
            </label>
          </div>

          {/* 6. Email */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Email
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* 7. Timezone */}
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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
        <div className="space-y-4 max-w-sm text-xs">
          <div>
            <label className="text-xs font-normal text-slate-700 dark:text-slate-300 block mb-1">
              New password
            </label>
            <input
              type="password"
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
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword && setConfirmPassword(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onChangePassword}
              disabled={savingPassword || !newPassword}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5b9bd5] hover:bg-[#4a8ac4] text-white text-xs font-medium rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="ri-save-line text-xs" />
              <span>{savingPassword ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
