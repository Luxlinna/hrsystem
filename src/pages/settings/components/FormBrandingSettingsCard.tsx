import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import {
  getOfficialFormLogo,
  getOpsBuLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
  getBuCompanyName,
  isHrDivisionScope,
  isCustomLogoActive,
  isCustomOpsLogoActive,
  saveOfficialFormBranding,
  saveOpsBuLogo,
  resetOfficialFormLogo,
  resetOpsBuLogo,
  DEFAULT_FORM_LOGO,
  DEFAULT_OPS_LOGO,
  DEFAULT_COMPANY_KHMER,
  DEFAULT_COMPANY_ENGLISH,
  DEFAULT_BU_COMPANY_NAME,
} from "@/services/formLogoService";

export function FormBrandingSettingsCard() {
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);
  const isAllBranches = effectiveBranchName === "All Branches";

  // HR Division branding state (Strictly UNI Holding)
  const [hrLogo, setHrLogo] = useState<string>(getOfficialFormLogo());
  const [khmerName, setKhmerName] = useState<string>(getOfficialCompanyNameKhmer());
  const [englishName, setEnglishName] = useState<string>(getOfficialCompanyNameEnglish());
  const [hasHrChanges, setHasHrChanges] = useState(false);

  // Business Unit branding state (Specific BU Logo & BU Company Name)
  const [buLogo, setBuLogo] = useState<string>(() => getOpsBuLogo(effectiveBranchName));
  const [buCompanyName, setBuCompanyName] = useState<string>(() =>
    getBuCompanyName(effectiveBranchName, DEFAULT_BU_COMPANY_NAME)
  );
  const [hasBuChanges, setHasBuChanges] = useState(false);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever active BU changes in top bar
  useEffect(() => {
    if (isCurrentScopeHr) {
      setHrLogo(getOfficialFormLogo());
      setKhmerName(getOfficialCompanyNameKhmer());
      setEnglishName(getOfficialCompanyNameEnglish());
      setHasHrChanges(false);
    } else {
      setBuLogo(getOpsBuLogo(effectiveBranchName));
      setBuCompanyName(getBuCompanyName(effectiveBranchName, DEFAULT_BU_COMPANY_NAME));
      setHasBuChanges(false);
    }
  }, [effectiveBranchName, isCurrentScopeHr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select a valid image file (PNG, JPG, WebP, or SVG).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("File Too Large", "Please select an image smaller than 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;

      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedBase64 = canvas.toDataURL("image/png");
          if (isCurrentScopeHr) {
            setHrLogo(optimizedBase64);
            setHasHrChanges(true);
          } else {
            setBuLogo(optimizedBase64);
            setHasBuChanges(true);
          }
        } else {
          if (isCurrentScopeHr) {
            setHrLogo(rawBase64);
            setHasHrChanges(true);
          } else {
            setBuLogo(rawBase64);
            setHasBuChanges(true);
          }
        }
      };
      img.onerror = () => {
        if (isCurrentScopeHr) {
          setHrLogo(rawBase64);
          setHasHrChanges(true);
        } else {
          setBuLogo(rawBase64);
          setHasBuChanges(true);
        }
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveHr = async () => {
    setSaving(true);
    try {
      await saveOfficialFormBranding(hrLogo, khmerName, englishName);
      setHasHrChanges(false);
      toast("HR Branding Saved", "HR Division document logo and titles updated successfully.", "success");
    } catch (err: any) {
      toast("Save Failed", err?.message || "Failed to update HR form branding.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBu = async () => {
    setSaving(true);
    try {
      await saveOpsBuLogo(buLogo, buCompanyName, effectiveBranchName);
      setHasBuChanges(false);
      toast(
        `${effectiveBranchName || "BU"} Branding Saved`,
        `Branding for ${effectiveBranchName || "Business Unit"} updated successfully.`,
        "success"
      );
    } catch (err: any) {
      toast("Save Failed", err?.message || "Failed to update BU logo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetHr = async () => {
    const confirmed = window.confirm("Reset the HR Division logo to the default official UNI holding logo?");
    if (!confirmed) return;

    setSaving(true);
    try {
      await resetOfficialFormLogo();
      setHrLogo(DEFAULT_FORM_LOGO);
      setKhmerName(DEFAULT_COMPANY_KHMER);
      setEnglishName(DEFAULT_COMPANY_ENGLISH);
      setHasHrChanges(false);
      toast("Reset Complete", "Reverted HR Division to default UNI Holding logo.", "info");
    } catch (err: any) {
      toast("Reset Failed", err?.message || "Failed to reset logo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetBu = async () => {
    const buLabel = effectiveBranchName || "Business Unit";
    const confirmed = window.confirm(`Reset the logo for ${buLabel} to the default logo?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      await resetOpsBuLogo(effectiveBranchName);
      setBuLogo(DEFAULT_OPS_LOGO);
      setBuCompanyName(effectiveBranchName || DEFAULT_BU_COMPANY_NAME);
      setHasBuChanges(false);
      toast("Reset Complete", `Reverted ${buLabel} to default logo.`, "info");
    } catch (err: any) {
      toast("Reset Failed", err?.message || "Failed to reset logo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const isHrCustom = isCustomLogoActive() || (hrLogo !== DEFAULT_FORM_LOGO && hrLogo.length > 50);
  const isBuCustom = isCustomOpsLogoActive(effectiveBranchName) || (buLogo !== DEFAULT_OPS_LOGO && buLogo.length > 50);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Case 1: "All Branches" selected */}
      {isAllBranches ? (
        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <i className="ri-building-line text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Select a Business Unit to Manage Logo &amp; Branding
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                You are currently viewing across all branches. To view and adjust an official logo, switch to your specific Business Unit (such as <strong>HR Division</strong> or <strong>OPS sulotion</strong>) from the top-bar branch selector. Each BU manages only its own logo.
              </p>
            </div>
          </div>
        </div>
      ) : isCurrentScopeHr ? (
        /* Case 2: HR Division BU Scope - Strictly HR Division (UNI Logo) */
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i className="ri-shield-check-fill text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Official Document Branding &mdash; HR Division (UNI Logo)
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#253C7D] dark:bg-blue-900/60 dark:text-blue-200">
                    HR Division Scope
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Exported forms and letters generated for the <strong>HR Division</strong> strictly use the official <strong>UNI Holding Logo</strong> and registered corporate legal names.
                </p>
              </div>
            </div>
          </div>

          {/* HR Logo Preview & Actions */}
          <div className="p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img src={hrLogo} alt="HR Division Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#253C7D] dark:text-blue-400 block font-['Kantumruy_Pro']">
                    {khmerName || DEFAULT_COMPANY_KHMER}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#253C7D] dark:bg-blue-900/60 dark:text-blue-200">
                    HR Division Only
                  </span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                  {englishName || DEFAULT_COMPANY_ENGLISH}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                  Applied strictly to Offer Letters, Evaluation Results, and HR Approval Forms for the HR Division.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-upload-2-line text-sm text-[#253C7D] dark:text-blue-400" />
                Upload New HR Logo
              </button>

              {isHrCustom && (
                <button
                  type="button"
                  onClick={handleResetHr}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-refresh-line text-sm" />
                  Reset to UNI Default
                </button>
              )}
            </div>
          </div>

          {/* Official Company Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Company Name (Khmer) &mdash; HR Division
              </label>
              <input
                type="text"
                value={khmerName}
                onChange={(e) => {
                  setKhmerName(e.target.value);
                  setHasHrChanges(true);
                }}
                placeholder="យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Official Company Name (English) &mdash; HR Division
              </label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => {
                  setEnglishName(e.target.value);
                  setHasHrChanges(true);
                }}
                placeholder="Unique Noble Investment Co. Ltd."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Unsaved Changes Banner */}
          {hasHrChanges && (
            <div className="pt-2 flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-900">
              <span className="text-xs text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                <i className="ri-information-line" /> You have unsaved HR branding changes.
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveHr}
                className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
                Save HR Branding
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Case 3: Operational BU Scope (e.g. OPS sulotion) - Strictly BU's own logo */
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <i className="ri-building-4-fill text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Official Document Branding &mdash; {effectiveBranchName || "Business Unit"}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    {effectiveBranchName || "Business Unit"} Scope
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Exported documents generated for <strong>{effectiveBranchName || "this Business Unit"}</strong> strictly use its own designated BU logo and corporate entity name.
                </p>
              </div>
            </div>
          </div>

          {/* BU Logo Preview & Actions */}
          <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img
                  src={buLogo}
                  alt={`${effectiveBranchName || "BU"} Logo`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                    {buCompanyName || effectiveBranchName || DEFAULT_BU_COMPANY_NAME}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Active BU
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block">
                  Automatically embedded on offer letters, interview evaluations, and approvals for {effectiveBranchName || "this Business Unit"}.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-upload-2-line text-sm text-emerald-600 dark:text-emerald-400" />
                Upload New {effectiveBranchName || "BU"} Logo
              </button>

              {isBuCustom && (
                <button
                  type="button"
                  onClick={handleResetBu}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-refresh-line text-sm" />
                  Reset to Default
                </button>
              )}
            </div>
          </div>

          {/* BU Company Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Business Unit / Operational Company Name
            </label>
            <input
              type="text"
              value={buCompanyName}
              onChange={(e) => {
                setBuCompanyName(e.target.value);
                setHasBuChanges(true);
              }}
              placeholder={effectiveBranchName || "OPS SOLUTIONS CO., LTD."}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used as the official company/entity name on offer letters and documents issued for {effectiveBranchName || "this Business Unit"}.
            </p>
          </div>

          {/* Unsaved Changes Banner */}
          {hasBuChanges && (
            <div className="pt-2 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <i className="ri-information-line" /> You have unsaved Business Unit branding changes.
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveBu}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
                Save BU Branding
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
