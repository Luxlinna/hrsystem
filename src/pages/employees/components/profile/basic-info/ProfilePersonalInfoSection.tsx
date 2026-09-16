import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";
import { ProfileIdentityFields } from "./ProfileIdentityFields";
import { ProfileDemographicFields } from "./ProfileDemographicFields";

interface Props extends BasicInfoSectionProps {
  saving: boolean;
  onSave: () => void;
}

export const ProfilePersonalInfoSection = memo(function ProfilePersonalInfoSection({
  employee,
  form,
  setForm,
  editing,
  saving,
  onSave,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center text-xl shadow-2xs">
            <i className="ri-user-smile-line" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              Personal Information &amp; Identity
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Official name records, gender, birth demographics, and citizenship status
            </p>
          </div>
        </div>
        {editing && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E3066] disabled:opacity-60 cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <i className="ri-loader-4-line animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="ri-check-line" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ProfileIdentityFields
          employee={employee}
          form={form}
          setForm={setForm}
          editing={editing}
        />
        <ProfileDemographicFields
          employee={employee}
          form={form}
          setForm={setForm}
          editing={editing}
        />
      </div>
    </div>
  );
});
