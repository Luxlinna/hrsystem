import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { useTheme } from "@/context/ThemeContext";

interface Branch {
  id: string;
  name: string;
  location: string;
  employee_count: number;
  status: string;
}

interface AppRole {
  id: number;
  name: string;
  is_admin: boolean;
  allowed_modules: string[];
}

const PERMISSION_COLUMNS = [
  { key: "employees", label: "Employees" },
  { key: "payroll", label: "Payroll" },
  { key: "finance", label: "Finance" },
  { key: "settings", label: "Settings" },
];

function PermissionsSection() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    supabase
      .from("app_roles")
      .select("id, name, is_admin, allowed_modules")
      .order("id")
      .then(({ data }) => {
        setRoles(data || []);
        setLoadingRoles(false);
      });
  }, []);

  if (loadingRoles) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px]">Loading roles...</span>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <p className="text-[13px] text-gray-400">
        No roles defined yet. Create roles from the{" "}
        <Link to="/admin" className="text-[#253C7D] font-semibold hover:underline">Admin Portal</Link>.
      </p>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-5 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <span>Role</span>
          {PERMISSION_COLUMNS.map((c) => <span key={c.key}>{c.label}</span>)}
        </div>
        {roles.map((r) => (
          <div key={r.id} className="grid grid-cols-5 px-5 py-4 border-t border-gray-50 items-center">
            <span className="text-[13px] font-medium text-gray-900">{r.name}</span>
            {PERMISSION_COLUMNS.map((c) => (
              <span key={c.key} className="text-[13px] text-gray-600">
                {r.is_admin || r.allowed_modules.includes("*") ? "Full" : r.allowed_modules.includes(c.key) ? "Access" : "None"}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <Link to="/admin" className="text-[12px] text-[#253C7D] font-semibold hover:underline">Manage roles in Admin Portal →</Link>
      </div>
    </div>
  );
}

function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    supabase
      .from("branches")
      .select("id, name, location, employee_count, status")
      .order("name")
      .then(({ data }) => {
        setBranches(data || []);
        setLoadingBranches(false);
      });
  }, []);

  if (loadingBranches) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px]">Loading branches...</span>
      </div>
    );
  }

  const activeBranches = branches.filter((b) => b.status === "active");
  const totalEmployees = branches.reduce((sum, b) => sum + (b.employee_count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-gray-500">
            <strong className="text-gray-900">{activeBranches.length}</strong> active &middot; {totalEmployees.toLocaleString()} total employees
          </span>
        </div>
        <Link
          to="/branches"
          className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap"
        >
          Manage in Branch Module
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className="border border-gray-100 rounded-xl p-5 flex items-start justify-between hover:border-[#253C7D]/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-building-line text-[#253C7D] text-sm w-5 h-5 flex items-center justify-center" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{b.name}</p>
                <p className="text-[12px] text-gray-500">{b.location}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-gray-400">{b.employee_count || 0} employees</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      b.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/branches"
              className="px-3 py-1.5 border border-gray-200 text-gray-700 text-[11px] font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  updated_at: string;
}

const keyLabels: Record<string, string> = {
  company_name: "Company Name",
  default_currency: "Default Currency",
  timezone: "Timezone",
  fiscal_year_start: "Fiscal Year Start",
  week_start_day: "Week Start Day",
  work_start_time: "Work Start Time",
  work_end_time: "Work End Time",
  working_days: "Working Days",
  saturday_start_time: "Saturday Start Time",
  saturday_end_time: "Saturday End Time",
  late_grace_minutes: "Late Grace Period",
  early_leave_grace_minutes: "Early Checkout Grace Period",
  checkout_reminder_minutes: "Checkout Reminder Window",
  default_work_hours: "Default Work Hours / Week",
  overtime_threshold: "Overtime Threshold (hours)",
  leave_approval_required: "Leave Approval Required",
  auto_payroll_reminder: "Auto Payroll Reminder",
  attendance_notify_scope: "Attendance Check-in/Check-out Notification Scope",
};

const notificationKeys = [
  { key: "notification_email_new_leave", label: "New leave request", channel: "email" },
  { key: "notification_push_new_leave", label: "New leave request", channel: "push" },
  { key: "notification_email_payroll", label: "Payroll processed", channel: "email" },
  { key: "notification_push_payroll", label: "Payroll processed", channel: "push" },
  { key: "notification_email_onboarding", label: "Onboarding milestone", channel: "email" },
  { key: "notification_push_onboarding", label: "Onboarding milestone", channel: "push" },
  { key: "notification_email_security", label: "Security alert", channel: "email" },
  { key: "notification_push_security", label: "Security alert", channel: "push" },
  { key: "notification_email_weekly", label: "Weekly summary", channel: "email" },
  { key: "notification_push_weekly", label: "Weekly summary", channel: "push" },
];

const timezoneOptions = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "CHF"];

export default function Settings() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { theme, setTheme } = useTheme();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [section, setSection] = useState("general");
  const [settings, setSettings] = useState<Record<string, Setting>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, string>>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("system_settings").select("*");
    const map: Record<string, Setting> = {};
    (data || []).forEach((s) => {
      map[s.key] = s;
    });
    setSettings(map);
    setEdited({});
    setLoading(false);
  };

  const updateValue = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string) => {
    const val = edited[key];
    if (val === undefined) return;
    setSaving(true);
    const { error } = await supabase
      .from("system_settings")
      .update({ value: val, updated_at: new Date().toISOString() })
      .eq("key", key);
    setSaving(false);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: val, updated_at: new Date().toISOString() },
    }));
    setEdited((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast("Saved", `${keyLabels[key] || key} updated successfully.`, "success");
    logActivity({ module: "settings", action: "updated", entityType: "system_setting", entityId: null, actorName, actorRole: role?.name || "Unknown", description: `${keyLabels[key] || key} setting updated` });
  };

  const saveAllGeneral = async () => {
    const generalKeys = Object.keys(keyLabels);
    const changed = generalKeys.filter((k) => edited[k] !== undefined);
    if (changed.length === 0) return;
    setSaving(true);
    for (const key of changed) {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: edited[key], updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) {
        setSaving(false);
        toast("Error", `Failed to save ${keyLabels[key] || key}: ${error.message}`, "error");
        return;
      }
    }
    setSaving(false);
    loadSettings();
    toast("Saved", "All general settings updated.", "success");
  };

  const saveAllNotifications = async () => {
    const changed = notificationKeys.filter((n) => edited[n.key] !== undefined);
    if (changed.length === 0) return;
    setSaving(true);
    for (const n of changed) {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: edited[n.key], updated_at: new Date().toISOString() })
        .eq("key", n.key);
      if (error) {
        setSaving(false);
        toast("Error", `Failed to save ${n.key}: ${error.message}`, "error");
        return;
      }
    }
    setSaving(false);
    loadSettings();
    toast("Saved", "Notification preferences updated.", "success");
  };

  const getVal = (key: string) =>
    edited[key] !== undefined ? edited[key] : settings[key]?.value || "";

  const hasChanges = (keys: string[]) => keys.some((k) => edited[k] !== undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
          System Settings
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Configure HR platform preferences — all changes are saved to the database
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "general", label: "General" },
          { key: "appearance", label: "Appearance" },
          { key: "notifications", label: "Notifications" },
          { key: "permissions", label: "Permissions" },
          { key: "branches", label: "Branches" },
          { key: "integrations", label: "Integrations" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
              section === s.key
                ? "bg-[#253C7D] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "appearance" && (
        <div className="max-w-xl space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Display Mode
            </label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { key: "light", label: "Light", icon: "ri-sun-line" },
                { key: "dark", label: "Dark", icon: "ri-moon-line" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTheme(option.key as "light" | "dark")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-[13px] font-semibold transition-colors ${
                    theme === option.key
                      ? "border-[#253C7D] bg-[#253C7D] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <i className={`${option.icon} text-base`} />
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              This preference is saved on this browser and applies across the system.
            </p>
          </div>
        </div>
      )}

      {/* General Settings */}
      {section === "general" && (
        <div className="w-full max-w-none space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Company Name
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={getVal("company_name")}
                onChange={(e) => updateValue("company_name", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              {edited["company_name"] !== undefined && (
                <button
                  onClick={() => saveSetting("company_name")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Default Currency
            </label>
            <div className="flex gap-2 mt-1">
              <select
                value={getVal("default_currency")}
                onChange={(e) => updateValue("default_currency", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {edited["default_currency"] !== undefined && (
                <button
                  onClick={() => saveSetting("default_currency")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Timezone
            </label>
            <div className="flex gap-2 mt-1">
              <select
                value={getVal("timezone")}
                onChange={(e) => updateValue("timezone", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              {edited["timezone"] !== undefined && (
                <button
                  onClick={() => saveSetting("timezone")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Fiscal Year Start
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="date"
                value={getVal("fiscal_year_start")}
                onChange={(e) => updateValue("fiscal_year_start", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              {edited["fiscal_year_start"] !== undefined && (
                <button
                  onClick={() => saveSetting("fiscal_year_start")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Week Start Day
            </label>
            <div className="flex gap-2 mt-1">
              <select
                value={getVal("week_start_day")}
                onChange={(e) => updateValue("week_start_day", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              >
                <option>Monday</option>
                <option>Sunday</option>
                <option>Saturday</option>
              </select>
              {edited["week_start_day"] !== undefined && (
                <button
                  onClick={() => saveSetting("week_start_day")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Work Start Time
            </label>
            <p className="text-[11px] text-gray-400 mt-0.5">Used by Clock In to mark arrivals late — e.g. 08:00 for an 8am start, every workday.</p>
            <div className="flex gap-2 mt-1">
              <input
                type="time"
                value={getVal("work_start_time")}
                onChange={(e) => updateValue("work_start_time", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              {edited["work_start_time"] !== undefined && (
                <button
                  onClick={() => saveSetting("work_start_time")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div className="w-full border border-[#253C7D]/30 bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-start gap-3 bg-[#253C7D] text-white p-5 sm:p-6">
              <div className="w-10 h-10 rounded-lg bg-white text-[#253C7D] flex items-center justify-center shrink-0">
                <i className="ri-calendar-schedule-line text-lg" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">Attendance Schedule</h3>
                <p className="text-[12px] text-white/75 mt-0.5">Control working days, shift hours, late arrival, early checkout, and reminder timing.</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["work_end_time", "working_days", "saturday_start_time", "saturday_end_time", "late_grace_minutes", "early_leave_grace_minutes", "checkout_reminder_minutes"].map((key) => (
                <div key={key} className="min-w-0">
                  <label className="text-[12px] font-semibold text-gray-800">{keyLabels[key]}</label>
                  <div className="flex gap-2 mt-1">
                    <input type={key.includes("time") ? "time" : key === "working_days" ? "text" : "number"} value={getVal(key)} onChange={(e) => updateValue(key, e.target.value)} className="min-w-0 flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]" />
                    {edited[key] !== undefined && <button onClick={() => saveSetting(key)} disabled={saving} className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg disabled:opacity-40">Save</button>}
                  </div>
                </div>
              ))}
              </div>
              <p className="text-[11px] text-gray-500 border-t border-gray-200 pt-4">Working days use day numbers: Sunday 0, Monday 1 through Saturday 6. Example: <span className="font-semibold text-gray-700">1,2,3,4,5,6</span>.</p>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Default Work Hours / Week
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={getVal("default_work_hours")}
                onChange={(e) => updateValue("default_work_hours", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              {edited["default_work_hours"] !== undefined && (
                <button
                  onClick={() => saveSetting("default_work_hours")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
              Overtime Threshold (hours)
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={getVal("overtime_threshold")}
                onChange={(e) => updateValue("overtime_threshold", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              {edited["overtime_threshold"] !== undefined && (
                <button
                  onClick={() => saveSetting("overtime_threshold")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="leave_approval"
              checked={getVal("leave_approval_required") === "true"}
              onChange={(e) =>
                updateValue("leave_approval_required", String(e.target.checked))
              }
              className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
            />
            <label
              htmlFor="leave_approval"
              className="text-[13px] text-gray-700 cursor-pointer"
            >
              Leave approval required for all leave requests
            </label>
            {edited["leave_approval_required"] !== undefined && (
              <button
                onClick={() => saveSetting("leave_approval_required")}
                disabled={saving}
                className="px-3 py-1 bg-[#253C7D] text-white text-[11px] font-semibold rounded-md hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                Save
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="payroll_reminder"
              checked={getVal("auto_payroll_reminder") === "true"}
              onChange={(e) =>
                updateValue("auto_payroll_reminder", String(e.target.checked))
              }
              className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
            />
            <label
              htmlFor="payroll_reminder"
              className="text-[13px] text-gray-700 cursor-pointer"
            >
              Auto send payroll reminders before processing
            </label>
            {edited["auto_payroll_reminder"] !== undefined && (
              <button
                onClick={() => saveSetting("auto_payroll_reminder")}
                disabled={saving}
                className="px-3 py-1 bg-[#253C7D] text-white text-[11px] font-semibold rounded-md hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                Save
              </button>
            )}
          </div>

          {hasChanges(Object.keys(keyLabels)) && (
            <button
              onClick={saveAllGeneral}
              disabled={saving}
              className="px-6 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      {section === "notifications" && (
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-gray-700">
              Configure which events trigger email and push notifications
            </p>
            {hasChanges(notificationKeys.map((n) => n.key)) && (
              <button
                onClick={saveAllNotifications}
                disabled={saving}
                className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {saving ? "Saving..." : "Save All"}
              </button>
            )}
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Event</span>
              <span className="text-center">Email</span>
              <span className="text-center">Push</span>
            </div>
            {[
              "New leave request",
              "Payroll processed",
              "Onboarding milestone",
              "Security alert",
              "Weekly summary",
            ].map((label) => {
              const emailKey = notificationKeys.find(
                (n) => n.label === label && n.channel === "email"
              )?.key || "";
              const pushKey = notificationKeys.find(
                (n) => n.label === label && n.channel === "push"
              )?.key || "";
              return (
                <div
                  key={label}
                  className="grid grid-cols-3 px-5 py-3.5 border-t border-gray-50 items-center"
                >
                  <span className="text-[13px] text-gray-700">{label}</span>
                  <div className="flex justify-center">
                    <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getVal(emailKey) === "true"}
                        onChange={(e) =>
                          updateValue(emailKey, String(e.target.checked))
                        }
                        className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
                      />
                      Email
                    </label>
                  </div>
                  <div className="flex justify-center">
                    <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getVal(pushKey) === "true"}
                        onChange={(e) =>
                          updateValue(pushKey, String(e.target.checked))
                        }
                        className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
                      />
                      Push
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border border-gray-100 rounded-xl p-5">
            <label className="text-[13px] font-semibold text-gray-700">
              Attendance check-in / check-out notifications
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
              Who receives these is set per-role in Admin Portal → Roles ("Receives attendance check-in / check-out
              notifications"). This controls how often they fire for whoever is opted in.
            </p>
            <div className="flex gap-2">
              <select
                value={getVal("attendance_notify_scope") || "exceptions"}
                onChange={(e) => updateValue("attendance_notify_scope", e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
              >
                <option value="exceptions">Only late check-ins / early check-outs</option>
                <option value="all">Every check-in and check-out</option>
              </select>
              {edited["attendance_notify_scope"] !== undefined && (
                <button
                  onClick={() => saveSetting("attendance_notify_scope")}
                  disabled={saving}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permissions */}
      {section === "permissions" && <PermissionsSection />}

      {/* Branches */}
      {section === "branches" && (
        <BranchesSection />
      )}

      {/* Integrations */}
      {section === "integrations" && (
        <div className="space-y-4">
          {[
            {
              name: "Slack",
              connected: true,
              desc: "Send HR notifications to Slack channels",
              lastSync: "2 hours ago",
            },
            {
              name: "Google Workspace",
              connected: true,
              desc: "Sync employee accounts and calendars",
              lastSync: "1 day ago",
            },
            {
              name: "Zoom",
              connected: false,
              desc: "Schedule interviews and meetings",
              lastSync: "Never",
            },
            {
              name: "QuickBooks",
              connected: true,
              desc: "Sync payroll and financial data",
              lastSync: "3 hours ago",
            },
            {
              name: "Stripe",
              connected: false,
              desc: "Process reimbursements and bonuses",
              lastSync: "Never",
            },
          ].map((int) => (
            <div
              key={int.name}
              className="border border-gray-100 rounded-xl p-5 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-gray-900">
                    {int.name}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      int.connected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {int.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500">{int.desc}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Last sync: {int.lastSync}
                </p>
              </div>
              <button
                className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  int.connected
                    ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                    : "border-[#253C7D] text-[#253C7D] hover:bg-[#253C7D]/5"
                }`}
              >
                {int.connected ? "Configure" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
