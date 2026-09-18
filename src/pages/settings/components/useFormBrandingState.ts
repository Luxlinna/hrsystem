import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { optimizeLogoImage } from "./brandingImageUtils";
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

export function useFormBrandingState() {
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    uploadFileToS3(file, "branding/logos").catch((s3Err) => {
      console.warn("Branding logo backup to AWS S3:", s3Err);
    });

    const optimizedBase64 = await optimizeLogoImage(file);
    if (!optimizedBase64) return;

    if (isCurrentScopeHr) {
      setHrLogo(optimizedBase64);
      setHasHrChanges(true);
    } else {
      setBuLogo(optimizedBase64);
      setHasBuChanges(true);
    }
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
    if (!window.confirm("Reset the HR Division logo to the default official UNI holding logo?")) return;
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
    if (!window.confirm(`Reset the logo for ${buLabel} to the default logo?`)) return;
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
  const isBuCustom =
    isCustomOpsLogoActive(effectiveBranchName) || (buLogo !== DEFAULT_OPS_LOGO && buLogo.length > 50);

  return {
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
  };
}
