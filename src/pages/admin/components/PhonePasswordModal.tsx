import { useState } from "react";
import type { UserAssignment } from "../types";
import { syntheticEmailToPhone } from "@/lib/phoneUtils";
import { createPhoneUserAccount } from "../api";
import { PhonePasswordSuccessView } from "./PhonePasswordSuccessView";

interface PhonePasswordModalProps {
  user: UserAssignment | null;
  onClose: () => void;
}

export function PhonePasswordModal({ user, onClose }: PhonePasswordModalProps) {
  const [newPhonePassword, setNewPhonePassword] = useState("");
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const phone = syntheticEmailToPhone(user.email);

  const handleGenerateModalPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPhonePassword(`Staff#${rand}`);
    setShowModalPassword(true);
    setModalError(null);
  };

  const handleSavePhonePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
        displayName: user.display_name || `Staff ${phone}`,
        roleId: user.role_id || null,
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
    const text = `Hello ${user.display_name || "Staff"},\n\nYour HR System login details:\nPhone: ${phone}\nPassword: ${newPhonePassword}\n\nPlease sign in at the login page using your phone number and password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#253C7D]/5 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shadow-md shadow-[#253C7D]/20">
              <i className="ri-key-2-line text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base leading-tight">
                {modalSuccess ? "Password Updated!" : "Phone User Password"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {user.display_name || phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {modalSuccess ? (
          <PhonePasswordSuccessView
            user={user}
            phone={phone}
            newPhonePassword={newPhonePassword}
            copied={copied}
            onCopyCredentials={handleCopyCredentials}
            onClose={onClose}
          />
        ) : (
          <form onSubmit={handleSavePhonePassword} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-slate-100">{user.display_name || "Staff Member"}</p>
                <p className="text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <i className="ri-phone-line text-gray-400 dark:text-slate-500" />
                  <span className="font-semibold text-gray-700 dark:text-slate-200">{phone}</span>
                </p>
              </div>
              <span className="text-[10px] font-semibold text-[#253C7D] dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 border border-blue-100 dark:border-sky-800/60 px-2 py-0.5 rounded-md">
                {user.branch_name || "Headquarters"}
              </span>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <i className="ri-error-warning-line text-sm shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">Set New Password *</label>
                <button
                  type="button"
                  onClick={handleGenerateModalPassword}
                  className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D] dark:focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <i className={showModalPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={modalSubmitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
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
  );
}
