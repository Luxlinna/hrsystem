import { supabase } from "@/lib/supabase";
import {
  DEFAULT_COMPANY_KHMER,
  DEFAULT_COMPANY_ENGLISH,
  DEFAULT_BU_COMPANY_NAME,
  STORAGE_KEY_LOGO,
  STORAGE_KEY_OPS_LOGO,
  STORAGE_KEY_KHMER,
  STORAGE_KEY_ENGLISH,
  STORAGE_KEY_BU_NAME,
  formLogoState,
  getSafeBuKey,
} from "./formLogoConstants";
import { isHrDivisionScope } from "./formLogoScopeUtils";

/**
 * Persist new official HR logo and branding to `system_settings` and update local cache.
 */
export async function saveOfficialFormBranding(
  logoBase64?: string | null,
  khmerName?: string | null,
  englishName?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const upserts: Array<{ key: string; value: string; updated_at: string }> = [];

  if (logoBase64 !== undefined) {
    const val = logoBase64 && logoBase64.trim().length > 50 ? logoBase64.trim() : "";
    upserts.push({ key: "official_form_logo", value: val, updated_at: now });
    formLogoState.inMemoryLogo = val || null;
    try {
      if (val) {
        localStorage.setItem(STORAGE_KEY_LOGO, val);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOGO);
      }
    } catch (_e) { /* localStorage unavailable – continue with default */ }
  }

  if (khmerName !== undefined) {
    const val = khmerName ? khmerName.trim() : DEFAULT_COMPANY_KHMER;
    upserts.push({ key: "company_khmer_name", value: val, updated_at: now });
    formLogoState.inMemoryKhmer = val;
    try {
      localStorage.setItem(STORAGE_KEY_KHMER, val);
    } catch (_e) { /* localStorage unavailable – continue with default */ }
  }

  if (englishName !== undefined) {
    const val = englishName ? englishName.trim() : DEFAULT_COMPANY_ENGLISH;
    upserts.push({ key: "company_english_name", value: val, updated_at: now });
    formLogoState.inMemoryEnglish = val;
    try {
      localStorage.setItem(STORAGE_KEY_ENGLISH, val);
    } catch (_e) { /* localStorage unavailable – continue with default */ }
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("system_settings")
      .upsert(upserts, { onConflict: "key" });

    if (error) {
      console.error("Failed to upsert official form branding:", error);
      throw error;
    }
  }
}

/**
 * Persist new Operations / BU logo and branding to `system_settings` and update local cache.
 */
export async function saveOpsBuLogo(
  logoBase64?: string | null,
  buCompanyName?: string | null,
  branchName?: string | null
): Promise<void> {
  const now = new Date().toISOString();
  const upserts: Array<{ key: string; value: string; updated_at: string }> = [];

  const buKey = branchName && !isHrDivisionScope(branchName) ? getSafeBuKey(branchName) : null;

  if (logoBase64 !== undefined) {
    const val = logoBase64 && logoBase64.trim().length > 50 ? logoBase64.trim() : "";
    formLogoState.inMemoryOpsLogo = val || null;
    try {
      if (val) {
        localStorage.setItem(STORAGE_KEY_OPS_LOGO, val);
        if (buKey) {
          localStorage.setItem(`hrm_bu_logo_${buKey}`, val);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY_OPS_LOGO);
        if (buKey) {
          localStorage.removeItem(`hrm_bu_logo_${buKey}`);
        }
      }
    } catch (_e) { /* localStorage unavailable – continue with default */ }
    upserts.push({ key: "bu_ops_logo", value: val, updated_at: now });
    if (buKey) {
      upserts.push({ key: `bu_logo_${buKey}`, value: val, updated_at: now });
    }
  }

  if (buCompanyName !== undefined) {
    const nameVal = buCompanyName ? buCompanyName.trim() : DEFAULT_BU_COMPANY_NAME;
    formLogoState.inMemoryBuName = nameVal;
    try {
      localStorage.setItem(STORAGE_KEY_BU_NAME, nameVal);
      if (buKey) {
        localStorage.setItem(`hrm_bu_name_${buKey}`, nameVal);
      }
    } catch (_e) { /* localStorage unavailable – continue with default */ }
    upserts.push({ key: "bu_company_name", value: nameVal, updated_at: now });
    if (buKey) {
      upserts.push({ key: `bu_name_${buKey}`, value: nameVal, updated_at: now });
    }
  }

  if (upserts.length > 0) {
    const { error } = await supabase
      .from("system_settings")
      .upsert(upserts, { onConflict: "key" });

    if (error) {
      console.error("Failed to upsert BU OPS logo:", error);
      throw error;
    }
  }
}

/**
 * Reset HR logo back to official UNI holding default logo.
 */
export async function resetOfficialFormLogo(): Promise<void> {
  await saveOfficialFormBranding("", DEFAULT_COMPANY_KHMER, DEFAULT_COMPANY_ENGLISH);
}

/**
 * Reset BU logo back to default OPS logo.
 */
export async function resetOpsBuLogo(branchName?: string | null): Promise<void> {
  await saveOpsBuLogo("", branchName || DEFAULT_BU_COMPANY_NAME, branchName);
}
