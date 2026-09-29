import { useState, memo } from "react";
import type { AssetCategoryCardConfig } from "../../constants";

export interface AssetSettingData {
  propertyOf: string;
  taggingMode: "Manual" | "Auto";
  prefix: string;
  sequenceNumber: string;
  categoryTags: Record<string, string>;
}

interface AssetSettingViewProps {
  categories: AssetCategoryCardConfig[];
  onUpdateCategoryTags?: (tagsMap: Record<string, string>) => void;
}

const STORAGE_KEY = "hr_asset_settings_config";

export const AssetSettingView = memo(function AssetSettingView({
  categories,
  onUpdateCategoryTags,
}: AssetSettingViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Load initial settings
  const [settings, setSettings] = useState<AssetSettingData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      propertyOf: "",
      taggingMode: "Auto",
      prefix: "",
      sequenceNumber: "0001",
      categoryTags: {},
    };
  });

  // Edit form state
  const [formData, setFormData] = useState<AssetSettingData>(settings);

  const handleStartEdit = () => {
    // Populate category tags with current category tags
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

  const handleCategoryTagChange = (categoryId: string, tagVal: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryTags: {
        ...prev.categoryTags,
        [categoryId]: tagVal,
      },
    }));
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

  const isConfigured = !!settings.propertyOf || Object.keys(settings.categoryTags).length > 0;

  return (
    <div className="space-y-4">
      {!isEditing ? (
        /* Overview Screen (Matching Screenshot 1) */
        <div className="space-y-4">
          {/* Top Row: Title & Action Button */}
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-xl font-normal text-slate-600 tracking-tight">
              Asset Setting
            </h2>

            <button
              type="button"
              onClick={handleStartEdit}
              className="px-4 py-2 rounded-md bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <i className="ri-edit-box-line text-sm" />
              <span>Edit Asset Setting</span>
            </button>
          </div>

          {/* Setting Content Area */}
          {!isConfigured ? (
            <div className="bg-white rounded-md border border-slate-200/80 p-8 text-center text-xs text-slate-500 font-medium">
              No records found
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Property Owner
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {settings.propertyOf || "General Organization"}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tagging Number Pattern
                  </span>
                  <p className="text-xs font-mono font-bold text-[#253C7D] mt-0.5">
                    {settings.prefix ? `${settings.prefix}-` : "-"}{settings.sequenceNumber || "0001"}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tagging Mode
                  </span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#253C7D] border border-blue-200">
                    {settings.taggingMode}
                  </span>
                </div>
              </div>

              {/* Category Tags Table */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Category Tag Mapping
                </h4>
                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No.</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4 w-40">Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">
                            {c.name}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                            {settings.categoryTags[c.id] || c.tag || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit Asset Setting Form (Matching Screenshot 2) */
        <div className="space-y-5">
          {/* Header Title */}
          <div className="pt-2">
            <h2 className="text-xl font-normal text-slate-600 tracking-tight">
              Asset Setting
            </h2>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-6 space-y-6">
            {/* Section Blue Title */}
            <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
              ASSET SETTING INFO
            </h3>

            {/* Form Fields */}
            <div className="space-y-4 max-w-3xl">
              {/* Property Of */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-semibold text-slate-700 sm:text-right">
                  Property Of <span className="text-rose-500">*</span>
                </label>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Property Of"
                    value={formData.propertyOf}
                    onChange={(e) => setFormData((p) => ({ ...p, propertyOf: e.target.value }))}
                    className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white shadow-2xs"
                  />
                </div>
              </div>

              {/* Tagging Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-xs font-semibold text-slate-700 sm:text-right">
                  Tagging
                </label>
                <div className="flex items-center gap-6 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="taggingMode"
                      value="Manual"
                      checked={formData.taggingMode === "Manual"}
                      onChange={() => setFormData((p) => ({ ...p, taggingMode: "Manual" }))}
                      className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
                    />
                    <span>Manual</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="taggingMode"
                      value="Auto"
                      checked={formData.taggingMode === "Auto"}
                      onChange={() => setFormData((p) => ({ ...p, taggingMode: "Auto" }))}
                      className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
                    />
                    <span>Auto</span>
                  </label>
                </div>
              </div>

              {/* Tagging Number Composite Input */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-4">
                <label className="text-xs font-semibold text-slate-700 sm:text-right pt-2">
                  Tagging Number
                </label>
                <div className="space-y-1.5 w-full max-w-md">
                  <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#253C7D] focus-within:ring-1 focus-within:ring-[#253C7D]">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Select prefix..."
                        value={formData.prefix}
                        onChange={(e) => setFormData((p) => ({ ...p, prefix: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <span className="px-2 text-slate-400 font-bold select-none">-</span>
                    <div className="w-28 border-l border-slate-200">
                      <input
                        type="text"
                        value={formData.sequenceNumber}
                        onChange={(e) => setFormData((p) => ({ ...p, sequenceNumber: e.target.value }))}
                        placeholder="0001"
                        className="w-full px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Example : {formData.prefix ? `${formData.prefix}-` : "-"}{formData.sequenceNumber || "0001"}
                  </p>
                </div>
              </div>

              {/* Categories Tag Table matching Screenshot 2 */}
              <div className="pt-3">
                <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No.</th>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4 w-36">Tag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-4 font-medium text-slate-800">
                            {c.name}
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={formData.categoryTags[c.id] ?? c.tag ?? ""}
                              onChange={(e) => handleCategoryTagChange(c.id, e.target.value)}
                              placeholder="Tag"
                              className="w-full px-2.5 py-1 rounded border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Footer Actions matching Screenshot 2 */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <i className="ri-save-line" />
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                className="px-3.5 py-2 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="ri-close-line" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
