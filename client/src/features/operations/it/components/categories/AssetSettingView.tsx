import { useState, memo } from "react";
import type { AssetCategoryCardConfig } from "../../constants";
import type { AssetSettingData } from "./types";
import { AssetSettingOverview } from "./settings/AssetSettingOverview";
import { AssetSettingEditForm } from "./settings/AssetSettingEditForm";

export type { AssetSettingData };

interface AssetSettingViewProps {
  categories: AssetCategoryCardConfig[];
  onUpdateCategoryTags?: (tagsMap: Record<string, string>) => void;
}

const STORAGE_KEY = "hr_asset_settings_config";

const DEFAULT_SETTINGS: AssetSettingData = {
  propertyOf: "",
  taggingMode: "Auto",
  prefix: "",
  sequenceNumber: "0001",
  categoryTags: {},
};

export const AssetSettingView = memo(function AssetSettingView({
  categories,
  onUpdateCategoryTags,
}: AssetSettingViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [settings, setSettings] = useState<AssetSettingData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [formData, setFormData] = useState<AssetSettingData>(settings);

  const handleStartEdit = () => {
    const initialTags: Record<string, string> = { ...settings.categoryTags };
    categories.forEach((c) => {
      if (!initialTags[c.id] && c.tag) {
        initialTags[c.id] = c.tag;
      }
    });

    setFormData({
      ...settings,
      categoryTags: initialTags,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    setSettings(formData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to persist asset settings:", e);
    }
    if (onUpdateCategoryTags) {
      onUpdateCategoryTags(formData.categoryTags);
    }
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setFormData(settings);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {!isEditing ? (
        <AssetSettingOverview
          settings={settings}
          categories={categories}
          onStartEdit={handleStartEdit}
        />
      ) : (
        <AssetSettingEditForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
});
