import React from "react";
import { useFormBrandingState } from "./useFormBrandingState";
import { FormBrandingHrDivisionSection } from "./FormBrandingHrDivisionSection";
import { FormBrandingBuSection } from "./FormBrandingBuSection";

export function FormBrandingSettingsCard() {
  const {
    effectiveBranchName,
    isCurrentScopeHr,
    isAllBranches,
    hrLogo,
    khmerName,
    setKhmerName,
    englishName,
    setEnglishName,
    hasHrChanges,
    buLogo,
    buCompanyName,
    setBuCompanyName,
    hasBuChanges,
    saving,
    fileInputRef,
    handleFileChange,
    handleSaveHr,
    handleSaveBu,
    handleResetHr,
    handleResetBu,
    isHrCustom,
    isBuCustom,
  } = useFormBrandingState();

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
        <FormBrandingHrDivisionSection
          hrLogo={hrLogo}
          khmerName={khmerName}
          setKhmerName={setKhmerName}
          englishName={englishName}
          setEnglishName={setEnglishName}
          hasHrChanges={hasHrChanges}
          isHrCustom={isHrCustom}
          saving={saving}
          onUploadClick={() => fileInputRef.current?.click()}
          onSaveHr={handleSaveHr}
          onResetHr={handleResetHr}
        />
      ) : (
        /* Case 3: Operational BU Scope (e.g. OPS sulotion) - Strictly BU's own logo */
        <FormBrandingBuSection
          effectiveBranchName={effectiveBranchName}
          buLogo={buLogo}
          buCompanyName={buCompanyName}
          setBuCompanyName={setBuCompanyName}
          hasBuChanges={hasBuChanges}
          isBuCustom={isBuCustom}
          saving={saving}
          onUploadClick={() => fileInputRef.current?.click()}
          onSaveBu={handleSaveBu}
          onResetBu={handleResetBu}
        />
      )}
    </div>
  );
}
