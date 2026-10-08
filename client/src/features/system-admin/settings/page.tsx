import { usePermissions } from "@/hooks/usePermissions";
import { useSettings } from "./hooks/useSettings";
import { SettingsNav } from "./components/SettingsNav";
import { AppearanceSettings } from "./components/AppearanceSettings";
import { NotificationsSettings } from "./components/NotificationsSettings";
import { PermissionsSection } from "./components/PermissionsSection";
import { BranchesSection } from "./components/BranchesSection";
import { IntegrationsSection } from "./components/IntegrationsSection";
import { EmailSmtpSection } from "./components/EmailSmtpSection";
import { OtpRateLimitSection } from "./components/OtpRateLimitSection";
import { PasswordResetLimitSection } from "./components/PasswordResetLimitSection";
import { CachePerformanceSection } from "./components/CachePerformanceSection";

export default function Settings() {
  const { isAdmin, can } = usePermissions();
  const {
    section,
    setSection,
    loading,
    saving,
    edited,
    getVal,
    hasChanges,
    updateValue,
    saveSetting,
    saveAllNotifications,
  } = useSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="w-10 h-10 border-2 border-[#253C7D] dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] dark:text-slate-100">
          System Settings
        </h1>
        <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-1">
          Configure HR platform preferences — all changes are saved to the database
        </p>
      </div>

      <SettingsNav active={section} onChange={setSection} />

      {section === "appearance" && <AppearanceSettings />}

      {section === "notifications" && (
        <NotificationsSettings
          getVal={getVal}
          updateValue={updateValue}
          saveSetting={saveSetting}
          hasChanges={hasChanges}
          saveAllNotifications={saveAllNotifications}
          saving={saving}
          edited={edited}
        />
      )}

      {section === "permissions" && isAdmin && <PermissionsSection />}
      {section === "branches" && can("branches") && <BranchesSection />}
      {section === "integrations" && <IntegrationsSection />}
      {section === "email_smtp" && <EmailSmtpSection />}
      {section === "otp_rate_limit" && <OtpRateLimitSection />}
      {section === "password_reset_limit" && <PasswordResetLimitSection />}
      {section === "cache_performance" && <CachePerformanceSection />}
    </div>
  );
}
