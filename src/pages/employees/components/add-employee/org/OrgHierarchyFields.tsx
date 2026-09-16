import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import { DEPARTMENTS, deriveBuHandle } from "../../../constants";

interface OrgHierarchyFieldsProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const OrgHierarchyFields = memo(function OrgHierarchyFields({
  form,
  onChange,
}: OrgHierarchyFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Code BU */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Code BU
        </label>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#253C7D] font-mono font-black text-xs shrink-0">
            {form.code_bu || "BU"}
          </span>
          <input
            type="text"
            value={form.code_bu}
            onChange={(e) => {
              const codeVal = e.target.value.toUpperCase();
              onChange("code_bu", codeVal);
              const currentDerived = deriveBuHandle(form.bu_full_name, form.code_bu);
              if (!form.handle_bu || form.handle_bu === currentDerived) {
                onChange("handle_bu", deriveBuHandle(form.bu_full_name, codeVal));
              }
            }}
            placeholder="e.g. EXP"
            className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* BU Full Name */}
      <div className="md:col-span-2">
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          BU Full Name
        </label>
        <input
          type="text"
          value={form.bu_full_name}
          onChange={(e) => {
            const val = e.target.value;
            onChange("bu_full_name", val);
            const currentDerived = deriveBuHandle(form.bu_full_name, form.code_bu);
            if (!form.handle_bu || form.handle_bu === currentDerived) {
              onChange("handle_bu", deriveBuHandle(val, form.code_bu));
            }
          }}
          placeholder="e.g. Express Delivery Business Unit"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Handle BU */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Handle BU
        </label>
        <input
          type="text"
          value={form.handle_bu}
          onChange={(e) => onChange("handle_bu", e.target.value)}
          placeholder="e.g. @express or EXP-OPS"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Division */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Division
        </label>
        <input
          type="text"
          value={form.division}
          onChange={(e) => onChange("division", e.target.value)}
          placeholder="e.g. Commercial & Operations"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Department <span className="text-rose-500">*</span>
        </label>
        <select
          value={form.department}
          onChange={(e) => onChange("department", e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Position / Role Title */}
      <div className="md:col-span-2">
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Position / Job Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.position || form.role}
          onChange={(e) => {
            onChange("position", e.target.value);
            onChange("role", e.target.value);
          }}
          placeholder="e.g. Operations Coordinator / Senior Specialist"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Working Location */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          Working Location / Province
        </label>
        <input
          type="text"
          value={form.working_location}
          onChange={(e) => onChange("working_location", e.target.value)}
          placeholder="e.g. Phnom Penh / Siem Reap"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </div>
  );
});
