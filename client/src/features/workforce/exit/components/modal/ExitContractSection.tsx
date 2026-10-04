import { memo } from "react";
import type { ExitFormState } from "../../types";
import { CONTRACT_TYPE_OPTIONS } from "../../constants";

interface ExitContractSectionProps {
  form: ExitFormState;
  onChange: (field: keyof ExitFormState, value: any) => void;
}

export const ExitContractSection = memo(function ExitContractSection({
  form,
  onChange,
}: ExitContractSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-1.5">
        Contract Info
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <label className="text-xs font-bold text-slate-700">
          Contracts <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-3 relative">
          <select
            required
            value={form.contract_type}
            onChange={(e) => onChange("contract_type", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] cursor-pointer appearance-none pr-8"
          >
            <option value="">Contracts</option>
            {CONTRACT_TYPE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
