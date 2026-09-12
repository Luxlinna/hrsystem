import { memo } from "react";
import type { OfferAllowanceItem } from "../../../types";

interface ProposalAllowancesSectionProps {
  allowances: OfferAllowanceItem[];
  handleAddAllowance: () => void;
  handleRemoveAllowance: (index: number) => void;
  handleUpdateAllowance: (index: number, field: "name" | "amount", value: any) => void;
  isBasedOnQualification: boolean;
  totalPackage: number;
}

export const ProposalAllowancesSection = memo(function ProposalAllowancesSection({
  allowances,
  handleAddAllowance,
  handleRemoveAllowance,
  handleUpdateAllowance,
  isBasedOnQualification,
  totalPackage,
}: ProposalAllowancesSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Monthly Allowances
        </label>
        <button
          type="button"
          onClick={handleAddAllowance}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
        >
          <i className="ri-add-circle-line" /> Add Allowance
        </button>
      </div>

      <div className="space-y-2">
        {allowances.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Allowance description (e.g. Phone, Transport)"
              value={item.name}
              onChange={(e) => handleUpdateAllowance(idx, "name", e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <div className="relative w-32">
              <span className="absolute left-2.5 top-1.5 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={item.amount}
                onChange={(e) => handleUpdateAllowance(idx, "amount", e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveAllowance(idx)}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Total package callout */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-blue-900">Total Monthly Compensation Package:</span>
        <div className="text-right flex items-center gap-2">
          {isBasedOnQualification && (
            <span className="text-[10px] font-extrabold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded-md border border-blue-200">
              Based on Qualification
            </span>
          )}
          <span className="text-base font-black text-blue-900">${totalPackage.toLocaleString()} / month</span>
        </div>
      </div>
    </div>
  );
});
