import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import {
  PersonalHeaderBanner,
  PersonalPhotoCard,
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
      <PersonalHeaderBanner />

      {/* Unified Seamless Personal Info Canvas */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-8">
        {/* 1. Profile Photo & Identity Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Photo Card on Left */}
          <div className="lg:col-span-4 xl:col-span-3.5 flex justify-center lg:sticky lg:top-4">
            <PersonalPhotoCard form={form} onChange={onChange} />
          </div>

          {/* Identity, Demographics & Tax on Right */}
          <div className="lg:col-span-8 xl:col-span-8.5 space-y-4">
            <PersonalIdentityFields form={form} onChange={onChange} />
            <PersonalDemographicFields form={form} onChange={onChange} />
            <PersonalTaxAndIdFields form={form} onChange={onChange} />
          </div>
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
    </div>
  );
});
