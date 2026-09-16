import { memo } from "react";
import type { BasicInfoOrgProps } from "./types";
import { ProfileOrgHierarchyFields } from "./ProfileOrgHierarchyFields";
import { ProfileHiringTermsFields } from "./ProfileHiringTermsFields";

export const ProfileOrgTermsSection = memo(function ProfileOrgTermsSection({
  employee,
  form,
  setForm,
  editing,
  manager,
  allEmployees,
  branches,
  workSites,
}: BasicInfoOrgProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg shadow-2xs">
          <i className="ri-building-line" />
        </div>
        <div>
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
            Organizational Hierarchy &amp; Hiring Terms
          </h3>
          <p className="text-[11px] text-gray-500 font-medium">
            Assigned Business Unit (BU), contract duration, working schedule, and reporting structure
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProfileOrgHierarchyFields
          employee={employee}
          form={form}
          setForm={setForm}
          editing={editing}
          manager={manager}
          allEmployees={allEmployees}
          branches={branches}
          workSites={workSites}
        />
        <ProfileHiringTermsFields
          employee={employee}
          form={form}
          setForm={setForm}
          editing={editing}
        />
      </div>
    </div>
  );
});
