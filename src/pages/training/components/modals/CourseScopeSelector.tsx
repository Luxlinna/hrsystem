import { memo } from "react";
import type { CourseFormState, Branch } from "../../types";

interface CourseScopeSelectorProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  branches: Branch[];
  isSuperAdmin: boolean;
  activeBranchName?: string;
}

export const CourseScopeSelector = memo(function CourseScopeSelector({
  form,
  setForm,
  branches,
  isSuperAdmin,
  activeBranchName,
}: CourseScopeSelectorProps) {
  return (
    <div className="bg-gray-50/90 border border-gray-200/80 rounded-xl p-3 space-y-2">
      <label className="block font-bold text-gray-800">
        Course Scope / Ownership <span className="text-rose-500">*</span>
      </label>
      {isSuperAdmin ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, is_admin_course: true, branch_id: "" })}
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              form.is_admin_course
                ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="ri-global-line text-base mt-0.5" />
            <div>
              <div className="font-bold text-[12px]">🌐 Company-Wide (Admin)</div>
              <div className="text-[10px] opacity-75">All branches can enroll</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_admin_course: false, branch_id: form.branch_id || branches[0]?.id || "" })}
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              !form.is_admin_course
                ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="ri-building-line text-base mt-0.5" />
            <div>
              <div className="font-bold text-[12px]">🏢 Branch-Specific</div>
              <div className="text-[10px] opacity-75">Only for specific branch</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg font-medium text-[11px]">
          <i className="ri-building-line text-[#253C7D] text-sm" />
          <span>Branch Course: <strong className="text-gray-900">{activeBranchName || "Your Branch"}</strong></span>
        </div>
      )}

      {isSuperAdmin && !form.is_admin_course && (
        <div className="mt-2">
          <label className="block font-semibold text-gray-700 mb-1">Target Branch</label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
