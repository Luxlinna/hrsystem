import { memo } from "react";
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
  newPassword: string;
  setNewPassword: (p: string) => void;
  confirmPassword: string;
  setConfirmPassword: (p: string) => void;
  savingPassword: boolean;
  onChangePassword: () => void;
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
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  savingPassword,
  onChangePassword,
}: ProfileAccountFormProps) {
  const isPhone = isPhoneSyntheticEmail(email);
  const displayLogin = isPhone ? formatDisplayPhone(syntheticEmailToPhone(email)) : (email || "");

  return (
    <div className="space-y-10">
      {/* Display name */}
      <div>
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Display Name
        </label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
          <button
            onClick={onSaveName}
            disabled={savingName}
            className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {savingName ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Account Login (Email or Phone) — read only */}
      <div>
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          {isPhone ? "Login Phone Number" : "Email Address"}
        </label>
        <div className="mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 font-medium">
          {displayLogin}
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          {isPhone
            ? "Contact an admin to change the login phone number on your account."
            : "Contact an admin to change the email on your account."}
        </p>
      </div>

      {/* Phone — editable, stored on the HR employee record */}
      {employee && (
        <div>
          <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
            {isPhone ? "Contact Phone (HR Record)" : "Phone Number"}
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
            />
            <button
              onClick={onSavePhone}
              disabled={savingPhone}
              className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
            >
              {savingPhone ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Password change */}
      <div className="pt-6 border-t border-gray-100">
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Change Password
        </label>
        <div className="space-y-3 mt-2 max-w-sm">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
          />
          <button
            onClick={onChangePassword}
            disabled={savingPassword || !newPassword}
            className="px-5 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
});
