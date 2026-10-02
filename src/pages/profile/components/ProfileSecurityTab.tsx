import { useState, useEffect, memo } from "react";
import { getPrivacyPin, setPrivacyPin, removePrivacyPin } from "@/lib/privacyPin";

interface ProfileSecurityTabProps {
  email?: string;
  isSuperAdmin?: boolean;
}

export const ProfileSecurityTab = memo(function ProfileSecurityTab({
  email,
  isSuperAdmin = false,
}: ProfileSecurityTabProps) {
  const [turnOn, setTurnOn] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const stored = getPrivacyPin(email);
    if (stored) {
      setTurnOn(true);
      setPinCode(stored);
      setConfirmPin(stored);
    }
  }, [email, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="py-12 text-center text-slate-500 text-xs">
        <i className="ri-shield-keyhole-line text-3xl mb-2 text-slate-400 block" />
        <p className="font-semibold text-slate-700 dark:text-slate-200">Access Restricted</p>
        <p className="text-slate-400 mt-1">Only Super Admins can view and update the Privacy PIN Code.</p>
      </div>
    );
  }

  const handleToggle = (checked: boolean) => {
    setTurnOn(checked);
    if (!checked) {
      removePrivacyPin(email);
      setPinCode("");
      setConfirmPin("");
    }
  };

  const handleSavePin = () => {
    if (pinCode && pinCode === confirmPin) {
      setPrivacyPin(pinCode, email);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <i className="ri-shield-check-line text-[#253C7D] dark:text-sky-400 text-base" />
            Privacy PIN & Security
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Configure secure master PIN code to protect sensitive operations
          </p>
        </div>
      </div>

      {/* Main Privacy PIN Settings */}
      <div className="max-w-md space-y-4">
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Enable Privacy PIN Protection
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Require PIN confirmation for sensitive administrative actions
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(!turnOn)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              turnOn ? "bg-[#253C7D] dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                turnOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {turnOn && (
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3.5 shadow-2xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Enter 4 to 6-Digit PIN Code
              </label>
              <div className="relative">
                <i className="ri-lock-password-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Confirm PIN Code
              </label>
              <div className="relative">
                <i className="ri-lock-password-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSavePin}
                disabled={!pinCode || pinCode !== confirmPin}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1E3064] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 active:scale-95"
              >
                <i className="ri-save-line text-xs" />
                <span>Save PIN Code</span>
              </button>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
                  <i className="ri-checkbox-circle-fill text-xs" /> PIN Saved Successfully!
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
