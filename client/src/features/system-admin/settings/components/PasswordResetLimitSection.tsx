import { useAuth } from "@/context/AuthContext";
import { usePasswordResetRateLimit } from "../hooks/usePasswordResetRateLimit";

function LimitField({
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

export function PasswordResetLimitSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const { config, update, loading, save, saving, dirty, lastSaved } =
    usePasswordResetRateLimit(actorName);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
          <i className="ri-key-2-line text-lg" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
            Password Reset Limits
          </h3>
        </div>
      </div>

      {/* Main Limits Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LimitField
            id="reset-lifetime"
            label="Reset Link Lifetime"
            value={config.password_reset_lifetime_minutes}
            unit="min"
            onChange={(v) => update("password_reset_lifetime_minutes", v)}
            min={5}
            max={1440}
          />
          <LimitField
            id="reset-per-hour"
            label="Max Requests Per Hour"
            value={config.password_reset_per_hour}
            unit="requests"
            onChange={(v) => update("password_reset_per_hour", v)}
            min={1}
            max={20}
          />
          <LimitField
            id="reset-resend-wait"
            label="Cooldown Before Resending"
            value={config.password_reset_resend_wait_seconds}
            unit="sec"
            onChange={(v) => update("password_reset_resend_wait_seconds", v)}
            min={10}
            max={3600}
          />
          <LimitField
            id="reset-max-daily"
            label="Max Daily Requests"
            value={config.password_reset_max_daily}
            unit="per day"
            onChange={(v) => update("password_reset_max_daily", v)}
            min={1}
            max={50}
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
              id="reset-limit-save-btn"
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
