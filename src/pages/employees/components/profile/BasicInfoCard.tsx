import { memo } from "react";
import type { Employee, ReportEntry } from "../../types";
import {
  ProfilePersonalInfoSection,
  ProfileIdentificationSection,
  ProfileContactAddressSection,
  ProfileOrgTermsSection,
  ProfileFamilySection,
  ProfileAchievementsSection,
  ProfileEditStickyBar,
} from "./basic-info";

interface BasicInfoCardProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
  saving: boolean;
  manager: ReportEntry | null;
  allEmployees: ReportEntry[];
  branches?: { id: string; name: string }[];
  workSites?: { id: string; name: string; branch_id: string }[];
  onSave: () => void;
}

export const BasicInfoCard = memo(function BasicInfoCard({
  employee,
  form,
  setForm,
  editing,
  saving,
  manager,
  allEmployees,
  branches = [],
  workSites = [],
  onSave,
}: BasicInfoCardProps) {
  return (
    <div className="space-y-6">
      {/* 1. Personal Information & Identity */}
      <ProfilePersonalInfoSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
        saving={saving}
        onSave={onSave}
      />

      {/* 2. Official Identification & Tax Credentials */}
      <ProfileIdentificationSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      {/* 3. Contact Channels & Residential Addresses */}
      <ProfileContactAddressSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      {/* 4. Organizational Hierarchy & Hiring Terms */}
      <ProfileOrgTermsSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
        manager={manager}
        allEmployees={allEmployees}
        branches={branches}
        workSites={workSites}
      />

      {/* 5. Registered Family Members */}
      <ProfileFamilySection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      {/* 6. Honors, Awards & Recognized Achievements */}
      <ProfileAchievementsSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      {/* 7. Sticky Bottom Action Bar */}
      <ProfileEditStickyBar
        editing={editing}
        saving={saving}
        onSave={onSave}
      />
    </div>
  );
});
