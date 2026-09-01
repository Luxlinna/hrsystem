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
    <div className="bg-slate-50/80 border border-gray-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-extrabold text-gray-900 text-xs sm:text-sm">
          Course Scope &amp; Target Branch <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-gray-400 font-medium">
          Defines who can discover and enroll in this course
        </span>
      </div>

      {isSuperAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, is_admin_course: true, branch_id: "" })}
            className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              form.is_admin_course
                ? "border-[#253C7D] bg-white text-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                : "border-gray-200 bg-white/70 text-gray-600 hover:bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              form.is_admin_course ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-500"
            }`}>
              <i className="ri-global-line text-lg" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm">Company-Wide (Global)</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Visible &amp; open to all branches across company</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_admin_course: false, branch_id: form.branch_id || branches[0]?.id || "" })}
            className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              !form.is_admin_course
                ? "border-[#253C7D] bg-white text-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                : "border-gray-200 bg-white/70 text-gray-600 hover:bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              !form.is_admin_course ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-500"
            }`}>
              <i className="ri-building-line text-lg" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm">Branch-Specific</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Restricted to employees of a designated branch</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-700 bg-white border border-gray-200 p-3 rounded-xl font-medium text-xs">
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
            <i className="ri-building-line text-base" />
          </div>
          <span>Branch Course: <strong className="text-gray-900 font-bold">{activeBranchName || "Your Branch"}</strong></span>
        </div>
      )}

      {isSuperAdmin && !form.is_admin_course && (
        <div className="pt-2 border-t border-gray-200/60 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="font-bold text-gray-700 text-xs shrink-0">Select Target Branch:</label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 font-bold text-xs sm:text-sm focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                🏢 {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
