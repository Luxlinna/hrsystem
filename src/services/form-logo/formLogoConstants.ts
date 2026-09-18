import { UNI_LOGO_BASE64 } from "@/pages/hire/exports/templates/uniLogoBase64";
import { OPS_LOGO_BASE64 } from "@/pages/hire/exports/opsLogoBase64";

export const DEFAULT_FORM_LOGO = UNI_LOGO_BASE64;
export const DEFAULT_OPS_LOGO = OPS_LOGO_BASE64;
export const DEFAULT_COMPANY_KHMER = "យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក";
export const DEFAULT_COMPANY_ENGLISH = "Unique Noble Investment Co. Ltd.";
export const DEFAULT_COMPANY_HOLDING = "UNI Holding";
export const DEFAULT_BU_COMPANY_NAME = "OPS Solutions Co., Ltd.";

export const STORAGE_KEY_LOGO = "hrm_official_form_logo";
export const STORAGE_KEY_OPS_LOGO = "hrm_bu_ops_logo";
export const STORAGE_KEY_KHMER = "hrm_company_khmer_name";
export const STORAGE_KEY_ENGLISH = "hrm_company_english_name";
export const STORAGE_KEY_BU_NAME = "hrm_bu_company_name";

export const formLogoState = {
  inMemoryLogo: null as string | null,
  inMemoryOpsLogo: null as string | null,
  inMemoryKhmer: null as string | null,
  inMemoryEnglish: null as string | null,
  inMemoryBuName: null as string | null,
};

// Initialize from localStorage if available
try {
  if (typeof window !== "undefined") {
    formLogoState.inMemoryLogo = localStorage.getItem(STORAGE_KEY_LOGO);
    formLogoState.inMemoryOpsLogo = localStorage.getItem(STORAGE_KEY_OPS_LOGO);
    formLogoState.inMemoryKhmer = localStorage.getItem(STORAGE_KEY_KHMER);
    formLogoState.inMemoryEnglish = localStorage.getItem(STORAGE_KEY_ENGLISH);
    formLogoState.inMemoryBuName = localStorage.getItem(STORAGE_KEY_BU_NAME);

    // Sanitize: If HR Division English name was contaminated with OPS from general settings, clean it
    if (formLogoState.inMemoryEnglish && formLogoState.inMemoryEnglish.toLowerCase().includes("ops")) {
      formLogoState.inMemoryEnglish = null;
      localStorage.removeItem(STORAGE_KEY_ENGLISH);
    }
  }
} catch {
  // Ignore storage access errors
}

export function getSafeBuKey(buName?: string | null): string {
  if (!buName) return "default";
  return buName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 40);
}
