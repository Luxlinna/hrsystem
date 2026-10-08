import { useAuth } from "@/context/AuthContext";
import { useOtpRateLimit } from "../hooks/useOtpRateLimit";

function OtpField({
  id,
  label,
  value,
  unit,
  onChange,
  min = 1,
  max = 9999,
}: {
  id: string;
  label: string;
  value: string;
  unit?: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-blue-500/20 focus:border-[#253C7D] dark:focus:border-blue-500 transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 dark:text-slate-500 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function OtpRateLimitSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const {
    config,
    update,
    loading,
    save,
    saving,
    dirty,
    lastSaved,
    toggleTelegramOtp,
    togglingTelegramOtp,
  } = useOtpRateLimit(actorName);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTelegramEnabled = config.telegram_otp_enabled !== "false";

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
          <i className="ri-shield-keyhole-line text-lg" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">OTP Rate Limits</h3>
        </div>
      </div>

      {/* Telegram Phone OTP Delivery Channel Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#229ED9] flex items-center justify-center text-xl shrink-0">
            <i className="ri-telegram-fill" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                Phone OTP via Telegram Bot
              </h4>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                  isTelegramEnabled
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                    : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isTelegramEnabled ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {isTelegramEnabled ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Switch Toggle */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
            {togglingTelegramOtp ? "Saving..." : isTelegramEnabled ? "Enabled" : "Disabled"}
          </span>
          <button
            type="button"
            role="switch"
            disabled={togglingTelegramOtp}
            aria-checked={isTelegramEnabled}
            onClick={() => toggleTelegramOtp(!isTelegramEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              isTelegramEnabled ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isTelegramEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Limits Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OtpField
            id="otp-lifetime"
            label="Code Lifetime"
            value={config.otp_code_lifetime_minutes}
            unit="min"
            onChange={(v) => update("otp_code_lifetime_minutes", v)}
            min={1}
            max={60}
          />
          <OtpField
            id="otp-per-hour"
            label="Max Codes Per Hour"
            value={config.otp_codes_per_hour}
            unit="codes"
            onChange={(v) => update("otp_codes_per_hour", v)}
            min={1}
            max={20}
          />
          <OtpField
            id="otp-wrong-tries"
            label="Wrong Tries Limit"
            value={config.otp_wrong_tries_per_code}
            unit="tries"
            onChange={(v) => update("otp_wrong_tries_per_code", v)}
            min={1}
            max={10}
          />
          <OtpField
            id="otp-resend-wait"
            label="Cooldown Before Resending"
            value={config.otp_resend_wait_seconds}
            unit="sec"
            onChange={(v) => update("otp_resend_wait_seconds", v)}
            min={10}
            max={3600}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            {lastSaved
              ? `Last updated: ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : "Default settings active"}
          </p>

          <div className="flex items-center gap-3">
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <i className="ri-error-warning-line text-xs" /> Unsaved
              </span>
            )}
            <button
              id="otp-save-btn"
              type="button"
              disabled={saving || !dirty}
              onClick={save}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-xs" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
