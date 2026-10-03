import { useAuth } from "@/context/AuthContext";
import { useOtpRateLimit } from "../hooks/useOtpRateLimit";

// ─── Tiny reusable field card ─────────────────────────────────────────────────
function OtpField({
  id,
  label,
  hint,
  value,
  unit,
  onChange,
  min = 1,
  max = 9999,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  unit?: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{hint}</p>
      </div>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-blue-500/20 focus:border-[#253C7D] dark:focus:border-blue-500 transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500 pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OtpRateLimitSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const { config, update, loading, save, saving, dirty, lastSaved } =
    useOtpRateLimit(actorName);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-start gap-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
          <i className="ri-shield-keyhole-line text-lg text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">OTP Rate Limits</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Control how often users can request and attempt one-time passwords. Changes take effect immediately.
          </p>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-6 shadow-xs">

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <OtpField
            id="otp-lifetime"
            label="Code lifetime (minutes)"
            hint="How long a 6-digit code works after it is sent."
            value={config.otp_code_lifetime_minutes}
            unit="min"
            onChange={(v) => update("otp_code_lifetime_minutes", v)}
            min={1}
            max={60}
          />
          <OtpField
            id="otp-per-hour"
            label="Codes per hour"
            hint="Most codes one phone number or email can request in an hour."
            value={config.otp_codes_per_hour}
            unit="codes"
            onChange={(v) => update("otp_codes_per_hour", v)}
            min={1}
            max={20}
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <OtpField
            id="otp-wrong-tries"
            label="Wrong tries per code"
            hint="After this many wrong entries the code stops working."
            value={config.otp_wrong_tries_per_code}
            unit="tries"
            onChange={(v) => update("otp_wrong_tries_per_code", v)}
            min={1}
            max={10}
          />
          <OtpField
            id="otp-resend-wait"
            label="Wait before resending (seconds)"
            hint="How long the user waits before they can ask for a new code."
            value={config.otp_resend_wait_seconds}
            unit="sec"
            onChange={(v) => update("otp_resend_wait_seconds", v)}
            min={10}
            max={3600}
          />
        </div>

        {/* Security callout */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
          <i className="ri-information-line text-base shrink-0 mt-0.5" />
          <span>
            <strong>Recommended:</strong> Code lifetime ≤ 10 min · Max 3–5 codes/hour · Max 3–5 wrong tries · Resend wait ≥ 30 sec
          </span>
        </div>

        {/* Footer: last saved + save button */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            {lastSaved
              ? `Last changed: ${new Date(lastSaved).toLocaleString()}`
              : "Not yet configured — using defaults"}
          </p>

          <div className="flex items-center gap-3">
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <i className="ri-error-warning-line" /> Unsaved
              </span>
            )}
            <button
              id="otp-save-btn"
              type="button"
              disabled={saving || !dirty}
              onClick={save}
              className="flex items-center gap-2 px-5 py-2 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-save-line" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Runtime enforcement info */}
      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 p-4 space-y-2 text-xs text-gray-500 dark:text-slate-400">
        <p className="font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
          <i className="ri-server-line" /> How enforcement works
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>The server reads these values on every OTP request — no restart needed.</li>
          <li>Rate limits are applied per identifier (email or phone number).</li>
          <li>Codes are invalidated immediately after the wrong-try limit is reached.</li>
          <li>All OTP events are written to the Activity Audit Log.</li>
        </ul>
      </div>

    </div>
  );
}
