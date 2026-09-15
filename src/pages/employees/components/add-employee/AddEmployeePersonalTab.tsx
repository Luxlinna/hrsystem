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

      {/* 1. Identity & Profile Photo Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Photo Card near personal info form */}
          <div className="lg:col-span-4 xl:col-span-3.5 flex justify-center lg:sticky lg:top-4">
            <PersonalPhotoCard form={form} onChange={onChange} />
          </div>

          {/* Form Fields: Identity, Demographics & Tax/ID */}
          <div className="lg:col-span-8 xl:col-span-8.5 space-y-4">
            <PersonalIdentityFields form={form} onChange={onChange} />
            <PersonalDemographicFields form={form} onChange={onChange} />
            <PersonalTaxAndIdFields form={form} onChange={onChange} />
          </div>
        </div>
      </div>

      {/* 2. Banking & Identification Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <PersonalBankAccountsSection form={form} onChange={onChange} />
        <PersonalIdentificationSection form={form} onChange={onChange} />
      </div>

      {/* 3. Address & Contact Information Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <PersonalContactSection form={form} onChange={onChange} />
        <PersonalPermanentAddressSection form={form} onChange={onChange} />
      </div>

      {/* 4. Emergency Contacts & Family Member Info Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <PersonalEmergencySection form={form} onChange={onChange} />
        <PersonalFamilySection form={form} onChange={onChange} />
      </div>

      {/* 5. Education & Training History Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <PersonalEducationSection form={form} onChange={onChange} />
        <PersonalTrainingSection form={form} onChange={onChange} />
      </div>

      {/* 6. Employment History & Achievements Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <PersonalEmploymentSection form={form} onChange={onChange} />
        <PersonalAchievementSection form={form} onChange={onChange} />
      </div>

      {/* 7. Document Attachments Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs">
        <PersonalAttachmentSection form={form} onChange={onChange} />
      </div>
    </div>
  );
});
