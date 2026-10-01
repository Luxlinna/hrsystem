import { useState, useEffect, memo } from "react";

interface ProfileSecurityTabProps {
  email?: string;
}

export const ProfileSecurityTab = memo(function ProfileSecurityTab({
  email,
}: ProfileSecurityTabProps) {
  const storageKey = `hrms_privacy_pin_${email || "default"}`;
  const [turnOn, setTurnOn] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setTurnOn(true);
      setPinCode(stored);
      setConfirmPin(stored);
    }
  }, [storageKey]);

  const handleToggle = (checked: boolean) => {
    setTurnOn(checked);
    if (!checked) {
      localStorage.removeItem(storageKey);
      setPinCode("");
      setConfirmPin("");
    }
  };

  const handleSavePin = () => {
    if (pinCode && pinCode === confirmPin) {
      localStorage.setItem(storageKey, pinCode);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="w-full">
      {/* Header Label matching Reference Image */}
      <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0284c7] dark:text-sky-400">
          PRIVACY PIN CODE
        </h3>
      </div>

      {/* Main Privacy PIN Settings matching Reference Screenshot */}
      <div className="py-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col gap-4">
          <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={turnOn}
              onChange={(e) => handleToggle(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
            />
            <span className="font-medium">Turn On</span>
          </label>

          {turnOn && (
            <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 max-w-sm space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Enter 4-Digit PIN Code
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Confirm PIN Code
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSavePin}
                  disabled={!pinCode || pinCode !== confirmPin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5b9bd5] hover:bg-[#4a8ac4] text-white text-xs font-medium rounded shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  <i className="ri-save-line text-xs" />
                  <span>Save PIN</span>
                </button>
                {savedSuccess && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    PIN Saved!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
