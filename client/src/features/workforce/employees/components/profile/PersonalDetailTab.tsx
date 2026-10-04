import { memo } from "react";
import type { Employee } from "../../types";
import {
  ProfilePersonalInfoSection,
  ProfileIdentificationSection,
  ProfileContactAddressSection,
  ProfileFamilySection,
  ProfileAchievementsSection,
  ProfileEditStickyBar,
} from "./basic-info";
import { EmployeeDocumentsCard } from "./EmployeeDocumentsCard";
import { LeaveHistoryCard } from "./LeaveHistoryCard";

interface PersonalDetailTabProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
  saving: boolean;
  onSave: () => void;
  leaveRequests?: any[];
}

export const PersonalDetailTab = memo(function PersonalDetailTab({
  employee,
  form,
  setForm,
  editing,
  saving,
  onSave,
  leaveRequests = [],
}: PersonalDetailTabProps) {
  return (
    <div className="space-y-6">
      <ProfilePersonalInfoSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
        saving={saving}
        onSave={onSave}
      />

      <ProfileIdentificationSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      <ProfileContactAddressSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      <ProfileFamilySection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      <ProfileAchievementsSection
        employee={employee}
        form={form}
        setForm={setForm}
        editing={editing}
      />

      <EmployeeDocumentsCard employee={employee} />
      <LeaveHistoryCard leaveRequests={leaveRequests} />

      <ProfileEditStickyBar
        editing={editing}
        saving={saving}
        onSave={onSave}
      />
    </div>
  );
});
