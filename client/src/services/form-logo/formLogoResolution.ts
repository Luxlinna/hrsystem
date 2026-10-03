import {
  DEFAULT_FORM_LOGO,
  DEFAULT_OPS_LOGO,
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
import { isHrDivisionScope, isExportAtHrDivision } from "./formLogoScopeUtils";

/**
 * Returns the active HR Division official logo (custom if configured, or default UNI logo).
 */
export function getOfficialFormLogo(): string {
  if (formLogoState.inMemoryLogo && formLogoState.inMemoryLogo.trim().length > 50) {
    return formLogoState.inMemoryLogo;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_LOGO) : null;
    if (stored && stored.trim().length > 50) {
      formLogoState.inMemoryLogo = stored;
      return stored;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return DEFAULT_FORM_LOGO;
}

/**
 * Returns the active Operations / General BU logo (custom if configured, or default OPS logo).
 * Supports BU-specific logo lookup by branchName.
 */
export function getOpsBuLogo(branchName?: string | null): string {
  if (branchName && !isHrDivisionScope(branchName)) {
    const key = `hrm_bu_logo_${getSafeBuKey(branchName)}`;
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (stored && stored.trim().length > 50) {
        return stored;
      }
    } catch (_e) { /* localStorage unavailable – continue with default */ }
  }
  if (formLogoState.inMemoryOpsLogo && formLogoState.inMemoryOpsLogo.trim().length > 50) {
    return formLogoState.inMemoryOpsLogo;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_OPS_LOGO) : null;
    if (stored && stored.trim().length > 50) {
      formLogoState.inMemoryOpsLogo = stored;
      return stored;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return DEFAULT_OPS_LOGO;
}

/**
 * Returns the official company Khmer name for document headers.
 */
export function getOfficialCompanyNameKhmer(): string {
  if (formLogoState.inMemoryKhmer && formLogoState.inMemoryKhmer.trim()) return formLogoState.inMemoryKhmer;
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_KHMER) : null;
    if (stored && stored.trim()) {
      formLogoState.inMemoryKhmer = stored;
      return stored;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return DEFAULT_COMPANY_KHMER;
}

/**
 * Returns the official company English name for document headers.
 */
export function getOfficialCompanyNameEnglish(): string {
  if (formLogoState.inMemoryEnglish && formLogoState.inMemoryEnglish.trim() && !formLogoState.inMemoryEnglish.toLowerCase().includes("ops")) {
    return formLogoState.inMemoryEnglish;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ENGLISH) : null;
    if (stored && stored.trim() && !stored.toLowerCase().includes("ops")) {
      formLogoState.inMemoryEnglish = stored;
      return stored;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return DEFAULT_COMPANY_ENGLISH;
}

/**
 * Returns the active company name for Operations / Business Units.
 * Supports BU-specific company name by branchName.
 */
export function getBuCompanyName(branchName?: string | null, fallback?: string): string {
  if (branchName && !isHrDivisionScope(branchName)) {
    const key = `hrm_bu_name_${getSafeBuKey(branchName)}`;
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (stored && stored.trim()) {
        return stored;
      }
    } catch (_e) { /* localStorage unavailable – continue with default */ }
  }
  if (formLogoState.inMemoryBuName && formLogoState.inMemoryBuName.trim()) {
    return formLogoState.inMemoryBuName;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_BU_NAME) : null;
    if (stored && stored.trim()) {
      formLogoState.inMemoryBuName = stored;
      return stored;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return branchName || fallback || DEFAULT_BU_COMPANY_NAME;
}

export type FormBrandingResult = {
  logo: string;
  companyName: string;
  companyKhmer: string;
  isHrDivision: boolean;
};

/**
 * Resolves the logo and branding dynamically according to the Business Unit:
 * - If export is at HR Division -> MUST strictly use the UNI logo (NO OPS), even if employee or request is from OPS.
 * - If export is at an operational BU (e.g. OPS) -> strictly uses the BU Logo (OPS Logo) and respective BU name.
 */
export function resolveDocumentBranding(params?: {
  businessUnit?: string | null;
  department?: string | null;
  division?: string | null;
  customLogo?: string | null;
  isHrDivisionContext?: boolean;
}): FormBrandingResult {
  const atHrDivision = isExportAtHrDivision(params);

  // STRICT REQUIREMENT: Every export file from HR Division MUST strictly use the official UNI logo (no OPS, no BU override)
  if (atHrDivision) {
    return {
      logo: getOfficialFormLogo(), // Official UNI Logo
      companyName: getOfficialCompanyNameEnglish(), // "Unique Noble Investment Co. Ltd."
      companyKhmer: getOfficialCompanyNameKhmer(), // "យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក"
      isHrDivision: true,
    };
  }

  if (params?.customLogo && params.customLogo.trim().length > 50) {
    return {
      logo: params.customLogo.trim(),
      companyName: params?.businessUnit || getBuCompanyName(params?.businessUnit),
      companyKhmer: "",
      isHrDivision: false,
    };
  }

  // Other Business Units strictly use their respective BU logo (OPS logo for operations)
  return {
    logo: getOpsBuLogo(params?.businessUnit),
    companyName: params?.businessUnit || getBuCompanyName(params?.businessUnit), // "OPS Solutions Co., Ltd."
    companyKhmer: "",
    isHrDivision: false,
  };
}

/**
 * Returns true if a custom HR logo is currently active instead of the default UNI logo.
 */
export function isCustomLogoActive(): boolean {
  const current = getOfficialFormLogo();
  return Boolean(current && current !== DEFAULT_FORM_LOGO);
}

/**
 * Returns true if a custom BU / OPS logo is currently active instead of the default OPS logo.
 */
export function isCustomOpsLogoActive(branchName?: string | null): boolean {
  const current = getOpsBuLogo(branchName);
  return Boolean(current && current !== DEFAULT_OPS_LOGO);
}
