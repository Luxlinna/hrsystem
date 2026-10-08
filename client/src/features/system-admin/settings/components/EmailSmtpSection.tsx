import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSmtpSettings } from "../hooks/useSmtpSettings";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-800 dark:text-slate-200">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-blue-500/20 focus:border-[#253C7D] dark:focus:border-blue-500 transition-colors ${className}`}
    />
  );
}

export function EmailSmtpSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const {
    config,
    update,
    applyPreset,
    load,
    loading,
    save,
    saving,
    sendTest,
    testing,
    hasPassword,
    dirty,
    QUICK_FILL,
  } = useSmtpSettings(actorName);

  const [showPass, setShowPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState(user?.email || "");

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConfigured = Boolean(config.smtp_host && config.smtp_from_email && hasPassword);

  return (
    <div className="w-full space-y-5">
      {/* ── Status Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <i className="ri-mail-settings-line text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                Email Delivery (SMTP)
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                  isConfigured
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConfigured ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {isConfigured ? "Configured" : "Not Configured"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Toggles: 2 Balanced Interactive Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-400 flex items-center justify-center shrink-0">
              <i className="ri-shield-check-line text-lg" />
            </div>
            <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
              Sign-up verification emails
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.smtp_send_on_signup === "true"}
            onClick={() => update("smtp_send_on_signup", config.smtp_send_on_signup === "true" ? "false" : "true")}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.smtp_send_on_signup === "true" ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                config.smtp_send_on_signup === "true" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <i className="ri-user-add-line text-lg" />
            </div>
            <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">
              User invitation emails
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.smtp_send_on_invite !== "false"}
            onClick={() => update("smtp_send_on_invite", config.smtp_send_on_invite !== "false" ? "false" : "true")}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.smtp_send_on_invite !== "false" ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                config.smtp_send_on_invite !== "false" ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Sender info Block ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sender Email">
            <Input
              id="smtp-from-email"
              type="email"
              value={config.smtp_from_email}
              onChange={(v) => update("smtp_from_email", v)}
              placeholder="noreply@yourcompany.com"
            />
          </Field>
          <Field label="Sender Name">
            <Input
              id="smtp-from-name"
              value={config.smtp_from_name}
              onChange={(v) => update("smtp_from_name", v)}
              placeholder="HRM System"
            />
          </Field>
        </div>
      </div>

      {/* ── SMTP Server Block ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
            Server Settings
          </h4>

          {/* Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Presets:</span>
            {Object.keys(QUICK_FILL).map((preset) => (
              <button
                key={preset}
                type="button"
                id={`smtp-preset-${preset.toLowerCase()}`}
                onClick={() => applyPreset(preset)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                  config.smtp_host === QUICK_FILL[preset].smtp_host
                    ? "bg-[#253C7D] dark:bg-blue-600 text-white border-[#253C7D] dark:border-blue-600"
                    : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-400"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Server + Port */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-4">
          <Field label="SMTP Host">
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

        {/* Username + Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Username">
            <Input
              id="smtp-username"
              type="email"
              value={config.smtp_user}
              onChange={(v) => update("smtp_user", v)}
              placeholder={config.smtp_from_email || "your@email.com"}
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <Input
                id="smtp-password"
                type={showPass ? "text" : "password"}
                value={config.smtp_pass}
                onChange={(v) => update("smtp_pass", v)}
                placeholder={hasPassword ? "••••••••••••••••" : "App password"}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <i className={showPass ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
              </button>
            </div>
          </Field>
        </div>

        {/* SSL/TLS Toggle */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={config.smtp_secure === "true"}
            onChange={(e) => {
              const nextSecure = e.target.checked ? "true" : "false";
              update("smtp_secure", nextSecure);
              if (nextSecure === "true" && config.smtp_port === "587") {
                update("smtp_port", "465");
              } else if (nextSecure === "false" && config.smtp_port === "465") {
                update("smtp_port", "587");
              }
            }}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
          />
          <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">
            SSL / TLS (Port 465)
          </span>
        </label>
      </div>

      {/* ── Action Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          <button
            id="smtp-save-btn"
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
                <span>Save Settings</span>
              </>
            )}
          </button>

          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <i className="ri-error-warning-line text-xs" /> Unsaved changes
            </span>
          )}
        </div>

        {isConfigured && (
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="Test email recipient..."
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#253C7D] w-48"
            />
            <button
              id="smtp-test-btn"
              type="button"
              disabled={testing || dirty}
              onClick={() => sendTest(testRecipient)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              {testing ? (
                <>
                  <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line text-xs" />
                  <span>Send Test</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
