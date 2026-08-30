import { memo } from "react";
import type { AnnouncementFormState } from "../types";

interface AnnouncementBranchScopePickerProps {
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
  isSuperAdmin: boolean;
  userBranchName?: string;
  userBranchId?: string | null;
}

export const AnnouncementBranchScopePicker = memo(function AnnouncementBranchScopePicker({
  form,
  setForm,
  isSuperAdmin,
  userBranchName,
  userBranchId,
}: AnnouncementBranchScopePickerProps) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-building-line text-[#253C7D]" />
          Branch Distribution Scope
        </span>
        {isSuperAdmin ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Super Admin Authority
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
            <i className="ri-lock-line text-xs" />
            Branch Locked
          </span>
        )}
      </div>

      {isSuperAdmin ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, branch_id: null }))}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              form.branch_id === null
                ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.branch_id === null ? "border-[#253C7D] bg-[#253C7D]" : "border-gray-300"}`}>
                {form.branch_id === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-xs font-bold text-gray-900">All Branches (Global)</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 ml-5.5">Visible to all partner branches across the company</p>
          </button>

          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, branch_id: userBranchId || null }))}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              form.branch_id !== null
                ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.branch_id !== null ? "border-[#253C7D] bg-[#253C7D]" : "border-gray-300"}`}>
                {form.branch_id !== null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="text-xs font-bold text-gray-900 truncate">{userBranchName || "Current Branch"}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 ml-5.5">Restricted strictly to users in this branch</p>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center font-bold text-xs">
              <i className="ri-community-line" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{userBranchName || "Your Home Branch"}</p>
              <p className="text-[10px] text-gray-400">Only users in your branch can view this announcement</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Branch Isolated
          </span>
        </div>
      )}
    </div>
  );
});
