import { supabase } from "@/lib/supabase";
import {
  DEFAULT_FORM_LOGO,
  DEFAULT_OPS_LOGO,
  DEFAULT_COMPANY_KHMER,
  DEFAULT_COMPANY_ENGLISH,
  STORAGE_KEY_LOGO,
  STORAGE_KEY_OPS_LOGO,
  STORAGE_KEY_KHMER,
  STORAGE_KEY_ENGLISH,
  STORAGE_KEY_BU_NAME,
  formLogoState,
} from "./formLogoConstants";
import {
  getOfficialFormLogo,
  getOpsBuLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "./formLogoResolution";

/**
 * Asynchronously fetch branding from the `system_settings` table and update cache.
 */
export async function syncOfficialFormLogoFromDb(): Promise<{
  logo: string;
  opsLogo: string;
  khmerName: string;
  englishName: string;
}> {
  try {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "official_form_logo",
        "bu_ops_logo",
        "company_khmer_name",
        "company_english_name",
        "company_name",
      ]);

    let logo = DEFAULT_FORM_LOGO;
    let opsLogo = DEFAULT_OPS_LOGO;
    let khmer = DEFAULT_COMPANY_KHMER;
    let english = DEFAULT_COMPANY_ENGLISH;

    if (data && data.length > 0) {
      const logoSetting = data.find((s) => s.key === "official_form_logo");
      const opsLogoSetting = data.find((s) => s.key === "bu_ops_logo");
      const khmerSetting = data.find((s) => s.key === "company_khmer_name");
      const englishSetting = data.find((s) => s.key === "company_english_name");
      const buNameSetting = data.find((s) => s.key === "bu_company_name");
      if (buNameSetting?.value && buNameSetting.value.trim()) {
        formLogoState.inMemoryBuName = buNameSetting.value.trim();
        try {
          localStorage.setItem(STORAGE_KEY_BU_NAME, formLogoState.inMemoryBuName);
        } catch (_e) { /* localStorage unavailable – continue with default */ }
      }

      if (logoSetting?.value && logoSetting.value.trim().length > 50) {
        logo = logoSetting.value.trim();
        formLogoState.inMemoryLogo = logo;
        try {
          localStorage.setItem(STORAGE_KEY_LOGO, logo);
        } catch (_e) { /* localStorage unavailable – continue with default */ }
      }

      if (opsLogoSetting?.value && opsLogoSetting.value.trim().length > 50) {
        opsLogo = opsLogoSetting.value.trim();
        formLogoState.inMemoryOpsLogo = opsLogo;
        try {
          localStorage.setItem(STORAGE_KEY_OPS_LOGO, opsLogo);
        } catch (_e) { /* localStorage unavailable – continue with default */ }
      }

      if (khmerSetting?.value && khmerSetting.value.trim()) {
        khmer = khmerSetting.value.trim();
        formLogoState.inMemoryKhmer = khmer;
        try {
          localStorage.setItem(STORAGE_KEY_KHMER, khmer);
        } catch (_e) { /* localStorage unavailable – continue with default */ }
      }

      if (englishSetting?.value && englishSetting.value.trim()) {
        const val = englishSetting.value.trim();
        // Prevent accidental contamination from general OPS company name
        if (!val.toLowerCase().includes("ops")) {
          english = val;
          formLogoState.inMemoryEnglish = english;
          try {
            localStorage.setItem(STORAGE_KEY_ENGLISH, english);
          } catch (_e) { /* localStorage unavailable – continue with default */ }
        }
      }
    }

    return { logo, opsLogo, khmerName: khmer, englishName: english };
  } catch (err) {
    console.warn("Failed to sync official form logo from database:", err);
    return {
      logo: getOfficialFormLogo(),
      opsLogo: getOpsBuLogo(),
      khmerName: getOfficialCompanyNameKhmer(),
      englishName: getOfficialCompanyNameEnglish(),
    };
  }
}
