import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSmtpSettings } from "../hooks/useSmtpSettings";

// ─── Tiny reusable field ──────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function Input({
  id, type = "text", value, onChange, placeholder, className = "",
}: {
  id: string; type?: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string; className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-blue-500/20 focus:border-[#253C7D] dark:focus:border-blue-500 transition-colors ${className}`}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EmailSmtpSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const {
    config, update, applyPreset,
    load, loading,
    save, saving,
    sendTest, testing,
    hasPassword,
    dirty,
    QUICK_FILL,
  } = useSmtpSettings(actorName);

  const [showPass, setShowPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState(user?.email || "");

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConfigured = Boolean(config.smtp_host && config.smtp_from_email && hasPassword);

  return (
    <div className="w-full space-y-6">

      {/* ── Status banner ── */}
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
          isConfigured
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"
        }`}
      >
        <i className={isConfigured ? "ri-checkbox-circle-line text-lg" : "ri-alert-line text-lg"} />
        {isConfigured
          ? "Ready to send email — a mail server password is saved."
          : "Not configured — fill in the fields below and save to enable email delivery."}
      </div>

      {/* ── Feature Toggles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            id="smtp-send-on-signup"
            type="checkbox"
            checked={config.smtp_send_on_signup === "true"}
            onChange={(e) => update("smtp_send_on_signup", e.target.checked ? "true" : "false")}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D]/30 cursor-pointer"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors">
              Send the sign-up code by email
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              When someone signs up, the 6-digit verification code is delivered by email.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            id="smtp-send-on-invite"
            type="checkbox"
            checked={config.smtp_send_on_invite !== "false"}
            onChange={(e) => update("smtp_send_on_invite", e.target.checked ? "true" : "false")}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D]/30 cursor-pointer"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors">
              Send user invitation by email
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              When an admin invites a user or employee, send the setup link using this SMTP.
            </p>
          </div>
        </label>
      </div>

      {/* ── Sender info ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Sender email">
          <Input
            id="smtp-from-email"
            type="email"
            value={config.smtp_from_email}
            onChange={(v) => update("smtp_from_email", v)}
            placeholder="noreply@yourcompany.com"
          />
        </Field>
        <Field label="Sender name">
          <Input
            id="smtp-from-name"
            value={config.smtp_from_name}
            onChange={(v) => update("smtp_from_name", v)}
            placeholder="HRM System"
          />
        </Field>
      </div>

      {/* ── SMTP Server section ── */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-5 bg-gray-50/50 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200">
            Email server (SMTP)
          </h3>

          {/* Quick-fill presets */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">Quick fill:</span>
            {Object.keys(QUICK_FILL).map((preset) => (
              <button
                key={preset}
                type="button"
                id={`smtp-preset-${preset.toLowerCase()}`}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  config.smtp_host === QUICK_FILL[preset].smtp_host
                    ? "bg-[#253C7D] dark:bg-blue-600 text-white border-[#253C7D] dark:border-blue-600"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-[#253C7D] dark:hover:border-blue-500"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Host + Port */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
          <Field label="Server">
            <Input
              id="smtp-host"
              value={config.smtp_host}
              onChange={(v) => update("smtp_host", v)}
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field label="Port">
            <Input
              id="smtp-port"
              type="number"
              value={config.smtp_port}
              onChange={(v) => {
                update("smtp_port", v);
                if (v === "465") update("smtp_secure", "true");
                else if (v === "587" || v === "25") update("smtp_secure", "false");
              }}
              placeholder="587"
            />
          </Field>
        </div>

        {/* Secure toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            role="switch"
            aria-checked={config.smtp_secure === "true"}
            onClick={() => {
              const nextSecure = config.smtp_secure === "true" ? "false" : "true";
              update("smtp_secure", nextSecure);
              if (nextSecure === "true" && config.smtp_port === "587") {
                update("smtp_port", "465");
              } else if (nextSecure === "false" && config.smtp_port === "465") {
                update("smtp_port", "587");
              }
            }}
            className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
              config.smtp_secure === "true"
                ? "bg-[#253C7D] dark:bg-blue-600"
                : "bg-gray-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                config.smtp_secure === "true" ? "translate-x-4.5" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-sm text-gray-700 dark:text-slate-300">
            Use SSL/TLS (port 465)
            <span className="ml-1.5 text-[11px] text-gray-400 dark:text-slate-500">
              — disable for STARTTLS (port 587)
            </span>
          </span>
        </label>

        {/* Username */}
        <Field label="Username" hint="Leave blank to use the sender email.">
          <Input
            id="smtp-username"
            type="email"
            value={config.smtp_user}
            onChange={(v) => update("smtp_user", v)}
            placeholder={config.smtp_from_email || "your@email.com"}
          />
        </Field>

        {/* Password */}
        <Field
          label="Password (App Password)"
          hint={
            hasPassword && !config.smtp_pass
              ? "A password is saved — type a new one to replace it."
              : "Stored encrypted and never shown again. For Gmail, use the 16-letter App Password."
          }
        >
          <div className="relative">
            <Input
              id="smtp-password"
              type={showPass ? "text" : "password"}
              value={config.smtp_pass}
              onChange={(v) => update("smtp_pass", v)}
              placeholder={hasPassword ? "••••••••••••••••" : "abcd efgh ijkl mnop"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
            >
              <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
            </button>
          </div>
        </Field>
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="smtp-save-btn"
            type="button"
            disabled={saving || !dirty}
            onClick={save}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><i className="ri-save-line" /> Save SMTP Settings</>
            )}
          </button>

          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <i className="ri-error-warning-line" /> Unsaved changes
            </span>
          )}
        </div>

        {isConfigured && (
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Recipient email..."
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#253C7D] w-48"
            />
            <button
              id="smtp-test-btn"
              type="button"
              disabled={testing || dirty}
              onClick={() => sendTest(testRecipient)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              {testing ? (
                <><span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Sending...</>
              ) : (
                <><i className="ri-mail-send-line" /> Send Test</>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
