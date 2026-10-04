import { memo } from "react";
import type { Branch, NewRecord } from "../types";

interface DisciplinaryScopePickerProps {
  isSuperAdmin: boolean;
  activeBranchName?: string;
  branches: Branch[];
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
}

export const DisciplinaryScopePicker = memo(function DisciplinaryScopePicker({
  isSuperAdmin,
  activeBranchName,
  branches,
  newRecord,
  setNewRecord,
}: DisciplinaryScopePickerProps) {
  return (
    <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-3 space-y-2">
      <label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider block">
        Record Scope / Jurisdiction <span className="text-rose-500">*</span>
      </label>
      {isSuperAdmin ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setNewRecord({ ...newRecord, is_admin_scope: true, branch_id: "" })}
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              newRecord.is_admin_scope
                ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="ri-global-line text-base mt-0.5" />
            <div>
              <div className="font-bold text-[12px]">🌐 Company-Wide (Admin)</div>
              <div className="text-[10px] opacity-75">Corporate compliance</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() =>
              setNewRecord({
                ...newRecord,
                is_admin_scope: false,
                branch_id: newRecord.branch_id || branches[0]?.id || "",
              })
            }
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              !newRecord.is_admin_scope
                ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <i className="ri-building-line text-base mt-0.5" />
            <div>
              <div className="font-bold text-[12px]">🏢 Branch-Specific</div>
              <div className="text-[10px] opacity-75">Specific branch case</div>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg font-medium text-[11px]">
          <i className="ri-building-line text-[#253C7D] text-sm" />
          <span>Branch Record: <strong className="text-gray-900">{activeBranchName || "Your Branch"}</strong></span>
        </div>
      )}

      {isSuperAdmin && !newRecord.is_admin_scope && (
        <div className="mt-2">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Branch</label>
          <select
            value={newRecord.branch_id}
            onChange={(e) => setNewRecord({ ...newRecord, branch_id: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-semibold text-xs focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
});
