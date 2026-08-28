import { usePermissions } from "@/hooks/usePermissions";
import { useSettings } from "./hooks/useSettings";
import { SettingsNav } from "./components/SettingsNav";
import { AppearanceSettings } from "./components/AppearanceSettings";
import { GeneralSettings } from "./components/GeneralSettings";
import { NotificationsSettings } from "./components/NotificationsSettings";
import { PermissionsSection } from "./components/PermissionsSection";
import { BranchesSection } from "./components/BranchesSection";
import { IntegrationsSection } from "./components/IntegrationsSection";

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
    saveAllGeneral,
    saveAllNotifications,
  } = useSettings();

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
          Configure HR platform preferences — all changes are saved to the
          database
        </p>
      </div>

      <SettingsNav active={section} onChange={setSection} />

      {section === "appearance" && <AppearanceSettings />}

      {section === "general" && (
        <GeneralSettings
          getVal={getVal}
          updateValue={updateValue}
          saveSetting={saveSetting}
          hasChanges={hasChanges}
          saveAllGeneral={saveAllGeneral}
          saving={saving}
          edited={edited}
        />
      )}

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
    </div>
  );
}
