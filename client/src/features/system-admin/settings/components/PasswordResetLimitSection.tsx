import { useAuth } from "@/context/AuthContext";
import { usePasswordResetRateLimit } from "../hooks/usePasswordResetRateLimit";

// ─── Reusable field card ──────────────────────────────────────────────────────
function LimitField({
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
export function PasswordResetLimitSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const { config, update, loading, save, saving, dirty, lastSaved } =
    usePasswordResetRateLimit(actorName);

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
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
          <i className="ri-key-2-line text-lg text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">Password Reset Rate Limits</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Protect accounts by limiting how frequently password recovery emails and links can be generated.
          </p>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-6 shadow-xs">

        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LimitField
            id="reset-lifetime"
            label="Reset link lifetime"
            hint="How long a generated password reset link remains valid."
            value={config.password_reset_lifetime_minutes}
            unit="min"
            onChange={(v) => update("password_reset_lifetime_minutes", v)}
            min={5}
            max={1440}
          />
          <LimitField
            id="reset-per-hour"
            label="Max requests per hour"
            hint="Maximum reset requests allowed per email/IP in an hour."
            value={config.password_reset_per_hour}
            unit="requests"
            onChange={(v) => update("password_reset_per_hour", v)}
            min={1}
            max={20}
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <LimitField
            id="reset-resend-wait"
            label="Wait before resending"
            hint="Cooldown period before another reset request can be submitted."
            value={config.password_reset_resend_wait_seconds}
            unit="sec"
            onChange={(v) => update("password_reset_resend_wait_seconds", v)}
            min={10}
            max={3600}
          />
          <LimitField
            id="reset-max-daily"
            label="Max daily requests"
            hint="Maximum total reset attempts permitted in a 24-hour period."
            value={config.password_reset_max_daily}
            unit="per day"
            onChange={(v) => update("password_reset_max_daily", v)}
            min={1}
            max={50}
          />
        </div>

        {/* Security recommendation banner */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-800 dark:text-blue-300">
          <i className="ri-shield-check-line text-base shrink-0 mt-0.5" />
          <span>
            <strong>Best practice:</strong> Link lifetime ≤ 60 min · Max 3 requests/hour · Resend wait ≥ 60 sec · Max 5 requests/day
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
              id="reset-limit-save-btn"
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
          <li>Settings are applied in real time to the password recovery APIs without requiring server restarts.</li>
          <li>Cooldown delays prevent rapid-fire email enumeration and spamming.</li>
          <li>Security violations are tracked and flagged in the Audit Log.</li>
        </ul>
      </div>

    </div>
  );
}
