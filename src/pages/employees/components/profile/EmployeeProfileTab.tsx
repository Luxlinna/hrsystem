import { memo } from "react";
import type { Employee } from "../../types";
import { ProfilePersonalInfoSection } from "./detail/ProfilePersonalInfoSection";
import { ProfileBankAndIdSection } from "./detail/ProfileBankAndIdSection";
import { ProfileAddressContactSection } from "./detail/ProfileAddressContactSection";
import { ProfileEmergencyAndFamilySection } from "./detail/ProfileEmergencyAndFamilySection";
import { ProfileEducationTrainingAndWorkSection } from "./detail/ProfileEducationTrainingAndWorkSection";
import { EmployeeMovementAttachmentSection } from "../overview/movements/EmployeeMovementAttachmentSection";

interface EmployeeProfileTabProps {
  employee: Employee;
}

export const EmployeeProfileTab = memo(function EmployeeProfileTab({
  employee,
}: EmployeeProfileTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Personal Info Key-Values */}
      <ProfilePersonalInfoSection employee={employee} />

      {/* 2. Employee Bank Accounts and Identifications */}
      <ProfileBankAndIdSection employee={employee} />

      {/* 3. Permanent Address and Contact Info */}
      <ProfileAddressContactSection employee={employee} />

      {/* 4. Emergency Contacts and Family Members */}
      <ProfileEmergencyAndFamilySection employee={employee} />

      {/* 5. Education, Training, and Employment History */}
      <ProfileEducationTrainingAndWorkSection employee={employee} />

      {/* 6. Attachment Info */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="personal" />
    </div>
  );
});
