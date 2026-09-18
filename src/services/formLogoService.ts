import { syncOfficialFormLogoFromDb } from "./form-logo/formLogoSync";

// Re-export constants
export {
  DEFAULT_FORM_LOGO,
  DEFAULT_OPS_LOGO,
  DEFAULT_COMPANY_KHMER,
  DEFAULT_COMPANY_ENGLISH,
  DEFAULT_COMPANY_HOLDING,
  DEFAULT_BU_COMPANY_NAME,
  getSafeBuKey,
} from "./form-logo/formLogoConstants";

// Re-export scope utilities
export {
  isHrDivisionScope,
  isCurrentActiveBranchHrDivision,
  isExportAtHrDivision,
} from "./form-logo/formLogoScopeUtils";

// Re-export resolution functions and types
export {
  getOfficialFormLogo,
  getOpsBuLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
  getBuCompanyName,
  resolveDocumentBranding,
  isCustomLogoActive,
  isCustomOpsLogoActive,
} from "./form-logo/formLogoResolution";

export type { FormBrandingResult } from "./form-logo/formLogoResolution";

// Re-export sync function
export { syncOfficialFormLogoFromDb } from "./form-logo/formLogoSync";

// Re-export save & reset actions
export {
  saveOfficialFormBranding,
  saveOpsBuLogo,
  resetOfficialFormLogo,
  resetOpsBuLogo,
} from "./form-logo/formLogoSaveActions";

// Auto-trigger sync on module load in browser
if (typeof window !== "undefined") {
  syncOfficialFormLogoFromDb();
}
