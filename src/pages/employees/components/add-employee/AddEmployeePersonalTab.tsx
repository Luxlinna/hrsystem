import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import {
  PersonalIdentityFields,
  PersonalDemographicFields,
  PersonalTaxAndIdFields,
  PersonalBankAccountsSection,
  PersonalIdentificationSection,
  PersonalPermanentAddressSection,
  PersonalContactSection,
  PersonalEmergencySection,
  PersonalFamilySection,
  PersonalEducationSection,
  PersonalTrainingSection,
  PersonalEmploymentSection,
  PersonalAchievementSection,
  PersonalNssfSection,
  PersonalAttachmentSection,
} from "./personal";

interface AddEmployeePersonalTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeePersonalTab = memo(function AddEmployeePersonalTab({
  form,
  onChange,
}: AddEmployeePersonalTabProps) {
  return (
    <div className="space-y-6 w-full">
      {/* 1. Identity, Demographics & Tax */}
      <div className="space-y-4">
        <PersonalIdentityFields form={form} onChange={onChange} />
        <PersonalDemographicFields form={form} onChange={onChange} />
        <PersonalTaxAndIdFields form={form} onChange={onChange} />
      </div>

      {/* 2. Bank Accounts */}
      <PersonalBankAccountsSection form={form} onChange={onChange} />

      {/* 3. Identification */}
      <PersonalIdentificationSection form={form} onChange={onChange} />

      {/* 4. Permanent Address */}
      <PersonalPermanentAddressSection form={form} onChange={onChange} />

      {/* 5. Contact Info */}
      <PersonalContactSection form={form} onChange={onChange} />

      {/* 6. Emergency Contacts */}
      <PersonalEmergencySection form={form} onChange={onChange} />

      {/* 7. Family Members */}
      <PersonalFamilySection form={form} onChange={onChange} />

      {/* 8. Education History */}
      <PersonalEducationSection form={form} onChange={onChange} />

      {/* 9. Training History */}
      <PersonalTrainingSection form={form} onChange={onChange} />

      {/* 10. Employment History */}
      <PersonalEmploymentSection form={form} onChange={onChange} />

      {/* 11. Achievements */}
      <PersonalAchievementSection form={form} onChange={onChange} />

      {/* 12. NSSF Registration */}
      <PersonalNssfSection form={form} onChange={onChange} />

      {/* 13. Attachments */}
      <PersonalAttachmentSection form={form} onChange={onChange} />
    </div>
  );
});
