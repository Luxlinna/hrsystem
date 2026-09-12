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

  // Default active tab to "ops" if user is on an Operations BU, or "hr" if on HR Division
  const [activeTab, setActiveTab] = useState<"hr" | "ops">(() => (isCurrentScopeHr ? "hr" : "ops"));

  // Keep active tab in sync if top-bar branch switches
  useEffect(() => {
    setActiveTab(isCurrentScopeHr ? "hr" : "ops");
  }, [effectiveBranchName, isCurrentScopeHr]);

  // HR Division branding state (Strictly UNI Holding)
  const [hrLogo, setHrLogo] = useState<string>(getOfficialFormLogo());
  const [khmerName, setKhmerName] = useState<string>(getOfficialCompanyNameKhmer());
  const [englishName, setEnglishName] = useState<string>(getOfficialCompanyNameEnglish());
  const [hasHrChanges, setHasHrChanges] = useState(false);

  // Operations / Other BU branding state (OPS Logo & BU Name)
  const [opsLogo, setOpsLogo] = useState<string>(getOpsBuLogo());
  const [opsCompanyName, setOpsCompanyName] = useState<string>(() =>
    getBuCompanyName(effectiveBranchName && !isCurrentScopeHr ? effectiveBranchName : DEFAULT_BU_COMPANY_NAME)
  );
  const [hasOpsChanges, setHasOpsChanges] = useState(false);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHrLogo(getOfficialFormLogo());
    setOpsLogo(getOpsBuLogo());
    setKhmerName(getOfficialCompanyNameKhmer());
    setEnglishName(getOfficialCompanyNameEnglish());
    setOpsCompanyName(getBuCompanyName(effectiveBranchName && !isCurrentScopeHr ? effectiveBranchName : DEFAULT_BU_COMPANY_NAME));
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
          if (activeTab === "hr") {
            setHrLogo(optimizedBase64);
            setHasHrChanges(true);
          } else {
            setOpsLogo(optimizedBase64);
            setHasOpsChanges(true);
          }
        } else {
          if (activeTab === "hr") {
            setHrLogo(rawBase64);
            setHasHrChanges(true);
          } else {
            setOpsLogo(rawBase64);
            setHasOpsChanges(true);
          }
        }
      };
      img.onerror = () => {
        if (activeTab === "hr") {
          setHrLogo(rawBase64);
          setHasHrChanges(true);
        } else {
          setOpsLogo(rawBase64);
          setHasOpsChanges(true);
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

  const handleSaveOps = async () => {
    setSaving(true);
    try {
      await saveOpsBuLogo(opsLogo, opsCompanyName);
      setHasOpsChanges(false);
      toast("BU Branding Saved", "Operations & BU branding updated successfully.", "success");
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

  const handleResetOps = async () => {
    const confirmed = window.confirm("Reset the Business Unit logo to the default OPS logo?");
    if (!confirmed) return;

    setSaving(true);
    try {
      await resetOpsBuLogo();
      setOpsLogo(DEFAULT_OPS_LOGO);
      setOpsCompanyName(DEFAULT_BU_COMPANY_NAME);
      setHasOpsChanges(false);
      toast("Reset Complete", "Reverted Business Unit to default OPS logo.", "info");
    } catch (err: any) {
      toast("Reset Failed", err?.message || "Failed to reset logo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const isHrCustom = isCustomLogoActive() || (hrLogo !== DEFAULT_FORM_LOGO && hrLogo.length > 50);
  const isOpsCustom = isCustomOpsLogoActive() || (opsLogo !== DEFAULT_OPS_LOGO && opsLogo.length > 50);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#253C7D] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-image-edit-line text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Official Forms &amp; Documents Branding by Business Unit (BU)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Exported forms dynamically use their respective Business Unit logo. 
              The <strong>UNI Logo</strong> is used exclusively for forms exported for the <strong>HR Division</strong>. 
              Other Business Units (e.g. Operations / OPS) use their designated <strong>BU Logo (OPS)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Active Context Division Indicator */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
          isCurrentScopeHr
            ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200"
            : "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <i
            className={
              isCurrentScopeHr
                ? "ri-shield-check-fill text-blue-600 text-base shrink-0"
                : "ri-building-4-fill text-emerald-600 text-base shrink-0"
            }
          />
          <span>
            Current Active BU: <strong>{effectiveBranchName || "All Branches"}</strong> &mdash; Active Document Output:{" "}
            <strong className="underline decoration-2 underline-offset-2">
              {isCurrentScopeHr ? "UNI Logo (HR Division)" : "OPS Logo (Business Unit)"}
            </strong>
          </span>
        </div>
        <span
          className={`self-start sm:self-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isCurrentScopeHr
              ? "bg-blue-600 text-white shadow-2xs"
              : "bg-emerald-600 text-white shadow-2xs"
          }`}
        >
          {isCurrentScopeHr ? "HR Division Scope" : "Operations BU Scope"}
        </span>
      </div>

      {/* Scope Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ops")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "ops"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <i className="ri-building-line text-sm" />
          Operations &amp; Other BUs (OPS Logo)
          {!isCurrentScopeHr && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 ml-1">
              Active BU
            </span>
          )}
          {isOpsCustom && <span className="w-2 h-2 rounded-full bg-amber-400" title="Custom logo active" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hr")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "hr"
              ? "bg-[#253C7D] text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          <i className="ri-shield-user-line text-sm" />
          HR Division (UNI Logo)
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-[#253C7D] dark:bg-blue-900/60 dark:text-blue-200">
            HR Only
          </span>
          {isCurrentScopeHr && (
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-400 text-white ml-1">
              Active Scope
            </span>
          )}
          {isHrCustom && <span className="w-2 h-2 rounded-full bg-amber-400" title="Custom logo active" />}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* TAB 1: Operations / Other BUs (OPS Logo) */}
      {activeTab === "ops" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img src={opsLogo} alt="BU Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 block">
                    {opsCompanyName || DEFAULT_BU_COMPANY_NAME}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Operations Scope
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium block">
                  Automatically embedded on offer letters, interview evaluations, and candidate approvals for Operations and general Business Units.
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
                Upload New BU Logo
              </button>

              {isOpsCustom && (
                <button
                  type="button"
                  onClick={handleResetOps}
                  disabled={saving}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-refresh-line text-sm" />
                  Reset to OPS Default
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Business Unit / Operational Company Name
            </label>
            <input
              type="text"
              value={opsCompanyName}
              onChange={(e) => {
                setOpsCompanyName(e.target.value);
                setHasOpsChanges(true);
              }}
              placeholder="OPS Solutions Co., Ltd."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used as the official company/entity name on offer letters and documents issued for Operations and general Business Units.
            </p>
          </div>

          {hasOpsChanges && (
            <div className="pt-2 flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900">
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                <i className="ri-information-line" /> You have unsaved Business Unit branding changes.
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveOps}
                className="px-4 py-2 bg-[#253C7D] hover:bg-[#1e3066] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-check-line text-sm" />}
                Save BU Branding
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HR Division (UNI Logo) */}
      {activeTab === "hr" && (
        <div className="space-y-5 animate-in fade-in duration-150">
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
      )}
    </div>
  );
}
