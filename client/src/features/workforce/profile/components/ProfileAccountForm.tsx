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

  const handleSave = () => onSaveName({ firstName, lastName, username, email: isSuperAdmin ? userEmail : undefined, timezone: isSuperAdmin ? timezone : undefined });
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
      {/* Top Underline Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 mb-6">
        {[
          { id: "personal_info", label: "Personal Info", icon: "ri-user-line" },
          { id: "change_password", label: "Change Password", icon: "ri-lock-password-line" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
              subTab === tab.id ? "border-[#0088cc] text-[#0088cc] dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <i className={`${tab.icon} text-sm ${subTab === tab.id ? "text-[#0088cc]" : "text-slate-400"}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {subTab === "personal_info" ? (
        <div className="space-y-6 max-w-2xl text-xs">
          {/* Account Role */}
          <div>
            <h3 className="text-[11.5px] font-bold text-[#0088cc] dark:text-sky-400 uppercase tracking-wider mb-3">Account Info & Roles</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center font-bold">
                  <i className="ri-shield-user-line text-sm" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">System Account Role</span>
                  <span className="text-[11px] text-slate-500">Assigned permissions and access tier</span>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{accountType}</span>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Personal Information */}
          <div>
            <h3 className="text-[11.5px] font-bold text-[#0088cc] dark:text-sky-400 uppercase tracking-wider mb-3">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "First Name", val: firstName, set: setFirstName },
                  { label: "Last Name", val: lastName, set: setLastName },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">{f.label} <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <i className="ri-user-3-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input type="text" value={f.val} onChange={(e) => f.set(e.target.value)} className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc]" />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">Username / Employee Code</label>
                <div className="relative">
                  <i className="ri-id-card-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0088cc]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">{isPhone ? "Phone Number" : "Email Address"}</label>
                  {!isSuperAdmin && <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1"><i className="ri-lock-line" /> Read Only</span>}
                </div>
                <div className="relative">
                  <i className={`${isPhone ? "ri-phone-line" : "ri-mail-line"} absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm`} />
                  <input type="text" value={displayContact} disabled={!isSuperAdmin} readOnly={!isSuperAdmin} onChange={(e) => setUserEmail(e.target.value)} className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-xs font-semibold ${!isSuperAdmin ? "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed" : "bg-white border border-slate-300 focus:border-[#0088cc]"}`} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Timezone</label>
                  {!isSuperAdmin && <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1"><i className="ri-lock-line" /> Read Only</span>}
                </div>
                <div className="relative">
                  <i className="ri-global-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <select value={timezone} disabled={!isSuperAdmin} onChange={(e) => setTimezone(e.target.value)} className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-xs font-semibold ${!isSuperAdmin ? "bg-slate-100 border border-slate-200 text-slate-600" : "bg-white border border-slate-300 focus:border-[#0088cc]"}`}>
                    <option value="(UTC+07:00) Bangkok, Hanoi, Jakarta">(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                    <option value="(UTC+08:00) Singapore, Kuala Lumpur">(UTC+08:00) Singapore, Kuala Lumpur</option>
                    <option value="(UTC+00:00) UTC / London">(UTC+00:00) UTC / London</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={handleSave} disabled={savingName} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer active:scale-95 disabled:opacity-50">
              <i className="ri-save-line text-xs" /><span>{savingName ? "Saving..." : "Save Changes"}</span>
            </button>
            <button type="button" onClick={handleDiscard} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer active:scale-95 border border-slate-200">
              <i className="ri-close-line text-xs" /><span>Discard</span>
            </button>
          </div>
        </div>
      ) : (
        <ProfilePasswordForm newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} savingPassword={savingPassword} onChangePassword={onChangePassword} />
      )}
    </div>
  );
});
