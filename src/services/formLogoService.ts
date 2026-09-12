import { supabase } from "@/lib/supabase";
import { UNI_LOGO_BASE64 } from "@/pages/hire/exports/templates/uniLogoBase64";
import { OPS_LOGO_BASE64 } from "@/pages/hire/exports/opsLogoBase64";

export const DEFAULT_FORM_LOGO = UNI_LOGO_BASE64;
export const DEFAULT_OPS_LOGO = OPS_LOGO_BASE64;
export const DEFAULT_COMPANY_KHMER = "យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក";
export const DEFAULT_COMPANY_ENGLISH = "Unique Noble Investment Co. Ltd.";
export const DEFAULT_COMPANY_HOLDING = "UNI Holding";
export const DEFAULT_BU_COMPANY_NAME = "OPS Solutions Co., Ltd.";

const STORAGE_KEY_LOGO = "hrm_official_form_logo";
const STORAGE_KEY_OPS_LOGO = "hrm_bu_ops_logo";
const STORAGE_KEY_KHMER = "hrm_company_khmer_name";
const STORAGE_KEY_ENGLISH = "hrm_company_english_name";
const STORAGE_KEY_BU_NAME = "hrm_bu_company_name";

let inMemoryLogo: string | null = null;
let inMemoryOpsLogo: string | null = null;
let inMemoryKhmer: string | null = null;
let inMemoryEnglish: string | null = null;
let inMemoryBuName: string | null = null;

// Initialize from localStorage if available
try {
  if (typeof window !== "undefined") {
    inMemoryLogo = localStorage.getItem(STORAGE_KEY_LOGO);
    inMemoryOpsLogo = localStorage.getItem(STORAGE_KEY_OPS_LOGO);
    inMemoryKhmer = localStorage.getItem(STORAGE_KEY_KHMER);
    inMemoryEnglish = localStorage.getItem(STORAGE_KEY_ENGLISH);
    inMemoryBuName = localStorage.getItem(STORAGE_KEY_BU_NAME);

    // Sanitize: If HR Division English name was contaminated with OPS from general settings, clean it
    if (inMemoryEnglish && inMemoryEnglish.toLowerCase().includes("ops")) {
      inMemoryEnglish = null;
      localStorage.removeItem(STORAGE_KEY_ENGLISH);
    }
  }
} catch {
  // Ignore storage access errors
}

/**
 * Checks if a scope/candidate/offer belongs to the HR Division.
 */
export function isHrDivisionScope(
  businessUnit?: string | null,
  department?: string | null,
  division?: string | null
): boolean {
  const combined = `${businessUnit || ""} ${department || ""} ${division || ""}`.toLowerCase().trim();
  if (
    combined.includes("hr division") ||
    combined.includes("human resources") ||
    combined.includes("human resource") ||
    combined.includes("uni holding") ||
    combined.includes("unique noble") ||
    combined.includes("hr-division") ||
    combined.includes("people & culture") ||
    combined.includes("people and culture") ||
    combined.includes("talent acquisition") ||
    /\bhr\b/i.test(combined)
  ) {
    return true;
  }
  return false;
}

/**
 * Returns the active HR Division official logo (custom if configured, or default UNI logo).
 */
export function getOfficialFormLogo(): string {
  if (inMemoryLogo && inMemoryLogo.trim().length > 50) {
    return inMemoryLogo;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_LOGO) : null;
    if (stored && stored.trim().length > 50) {
      inMemoryLogo = stored;
      return stored;
    }
  } catch {}
  return DEFAULT_FORM_LOGO;
}

export function getSafeBuKey(buName?: string | null): string {
  if (!buName) return "default";
  return buName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 40);
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
    } catch {}
  }
  if (inMemoryOpsLogo && inMemoryOpsLogo.trim().length > 50) {
    return inMemoryOpsLogo;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_OPS_LOGO) : null;
    if (stored && stored.trim().length > 50) {
      inMemoryOpsLogo = stored;
      return stored;
    }
  } catch {}
  return DEFAULT_OPS_LOGO;
}

/**
 * Returns the official company Khmer name for document headers.
 */
export function getOfficialCompanyNameKhmer(): string {
  if (inMemoryKhmer && inMemoryKhmer.trim()) return inMemoryKhmer;
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_KHMER) : null;
    if (stored && stored.trim()) {
      inMemoryKhmer = stored;
      return stored;
    }
  } catch {}
  return DEFAULT_COMPANY_KHMER;
}

/**
 * Returns the official company English name for document headers.
 */
export function getOfficialCompanyNameEnglish(): string {
  if (inMemoryEnglish && inMemoryEnglish.trim() && !inMemoryEnglish.toLowerCase().includes("ops")) {
    return inMemoryEnglish;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ENGLISH) : null;
    if (stored && stored.trim() && !stored.toLowerCase().includes("ops")) {
      inMemoryEnglish = stored;
      return stored;
    }
  } catch {}
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
    } catch {}
  }
  if (inMemoryBuName && inMemoryBuName.trim()) {
    return inMemoryBuName;
  }
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_BU_NAME) : null;
    if (stored && stored.trim()) {
      inMemoryBuName = stored;
      return stored;
    }
  } catch {}
  return branchName || fallback || DEFAULT_BU_COMPANY_NAME;
}

/**
 * Checks if the currently active branch in the application header / local state is the HR Division.
 */
export function isCurrentActiveBranchHrDivision(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const branchName = (localStorage.getItem("hrm_selected_branch_name") || "").toLowerCase().trim();
    const branchId = (localStorage.getItem("hrm_selected_branch_id") || "").trim();

    // Check by name
    if (
      branchName.includes("hr division") ||
      branchName.includes("human resource") ||
      branchName.includes("human resources") ||
      branchName.includes("uni holding") ||
      branchName.includes("unique noble") ||
      /\bhr\b/i.test(branchName)
    ) {
      return true;
    }

    // Check by known HR Division ID from Supabase branches table
    if (branchId === "68b6c801-3581-460a-9918-2c6b5434fc7c") {
      return true;
    }

    const currentScope = (localStorage.getItem("hrm_current_scope") || "").toLowerCase().trim();
    if (currentScope === "hr" || currentScope.includes("hr division")) {
      return true;
    }
  } catch {}
  return false;
}

/**
 * Determines whether a document export is taking place at / by the HR Division.
 * When true, the document MUST strictly use the UNI Logo (NO OPS),
 * even if the candidate, employee, or requisition originated from OPS.
 */
export function isExportAtHrDivision(params?: {
  businessUnit?: string | null;
  department?: string | null;
  division?: string | null;
  isHrDivisionContext?: boolean;
}): boolean {
  // 1. Explicit caller context (e.g. from HR Review / HR Division modal)
  if (params?.isHrDivisionContext === true) {
    return true;
  }

  // 2. Active top-bar branch is HR Division
  if (isCurrentActiveBranchHrDivision()) {
    return true;
  }

  // 3. The candidate / employee / requisition itself belongs directly to the HR Division
  if (isHrDivisionScope(params?.businessUnit, params?.department, params?.division)) {
    return true;
  }

  return false;
}

/**
 * Resolves the logo and branding dynamically according to the Business Unit:
 * - If export is at HR Division -> MUST work with UNI logo (NO OPS), even if employee or request is from OPS.
 * - If export is at an operational BU (e.g. OPS) -> strictly uses the BU Logo (OPS Logo) and respective BU name.
 */
export function resolveDocumentBranding(params: {
  businessUnit?: string | null;
  department?: string | null;
  division?: string | null;
  customLogo?: string | null;
  isHrDivisionContext?: boolean;
}): {
  logo: string;
  companyName: string;
  companyKhmer: string;
  isHrDivision: boolean;
} {
  const atHrDivision = isExportAtHrDivision(params);

  if (params.customLogo && params.customLogo.trim().length > 50) {
    return {
      logo: params.customLogo.trim(),
      companyName: params.businessUnit || (atHrDivision ? getOfficialCompanyNameEnglish() : getBuCompanyName()),
      companyKhmer: atHrDivision ? getOfficialCompanyNameKhmer() : "",
      isHrDivision: atHrDivision,
    };
  }

  if (atHrDivision) {
    // When exporting at HR Division: MUST WORK WITH UNI LOGO, NO OPS, even if employee or request was from OPS
    return {
      logo: getOfficialFormLogo(), // Official UNI Logo
      companyName: getOfficialCompanyNameEnglish(), // "Unique Noble Investment Co. Ltd."
      companyKhmer: getOfficialCompanyNameKhmer(), // "យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក"
      isHrDivision: true,
    };
  }

  // Other Business Units strictly use their respective BU logo (OPS logo for operations)
  return {
    logo: getOpsBuLogo(params.businessUnit),
    companyName: params.businessUnit || getBuCompanyName(params.businessUnit), // "OPS Solutions Co., Ltd."
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
        inMemoryBuName = buNameSetting.value.trim();
        try {
          localStorage.setItem(STORAGE_KEY_BU_NAME, inMemoryBuName);
        } catch {}
      }

      if (logoSetting?.value && logoSetting.value.trim().length > 50) {
        logo = logoSetting.value.trim();
        inMemoryLogo = logo;
        try {
          localStorage.setItem(STORAGE_KEY_LOGO, logo);
        } catch {}
      }

      if (opsLogoSetting?.value && opsLogoSetting.value.trim().length > 50) {
        opsLogo = opsLogoSetting.value.trim();
        inMemoryOpsLogo = opsLogo;
        try {
          localStorage.setItem(STORAGE_KEY_OPS_LOGO, opsLogo);
        } catch {}
      }

      if (khmerSetting?.value && khmerSetting.value.trim()) {
        khmer = khmerSetting.value.trim();
        inMemoryKhmer = khmer;
        try {
          localStorage.setItem(STORAGE_KEY_KHMER, khmer);
        } catch {}
      }

      if (englishSetting?.value && englishSetting.value.trim()) {
        const val = englishSetting.value.trim();
        // Prevent accidental contamination from general OPS company name
        if (!val.toLowerCase().includes("ops")) {
          english = val;
          inMemoryEnglish = english;
          try {
            localStorage.setItem(STORAGE_KEY_ENGLISH, english);
          } catch {}
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
    inMemoryLogo = val || null;
    try {
      if (val) {
        localStorage.setItem(STORAGE_KEY_LOGO, val);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOGO);
      }
    } catch {}
  }

  if (khmerName !== undefined) {
    const val = khmerName ? khmerName.trim() : DEFAULT_COMPANY_KHMER;
    upserts.push({ key: "company_khmer_name", value: val, updated_at: now });
    inMemoryKhmer = val;
    try {
      localStorage.setItem(STORAGE_KEY_KHMER, val);
    } catch {}
  }

  if (englishName !== undefined) {
    const val = englishName ? englishName.trim() : DEFAULT_COMPANY_ENGLISH;
    upserts.push({ key: "company_english_name", value: val, updated_at: now });
    inMemoryEnglish = val;
    try {
      localStorage.setItem(STORAGE_KEY_ENGLISH, val);
    } catch {}
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
    inMemoryOpsLogo = val || null;
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
    } catch {}
    upserts.push({ key: "bu_ops_logo", value: val, updated_at: now });
    if (buKey) {
      upserts.push({ key: `bu_logo_${buKey}`, value: val, updated_at: now });
    }
  }

  if (buCompanyName !== undefined) {
    const nameVal = buCompanyName ? buCompanyName.trim() : DEFAULT_BU_COMPANY_NAME;
    inMemoryBuName = nameVal;
    try {
      localStorage.setItem(STORAGE_KEY_BU_NAME, nameVal);
      if (buKey) {
        localStorage.setItem(`hrm_bu_name_${buKey}`, nameVal);
      }
    } catch {}
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

// Auto-trigger sync on module load in browser
if (typeof window !== "undefined") {
  syncOfficialFormLogoFromDb();
}
