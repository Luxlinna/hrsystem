import { memo } from "react";
import type { AssignFormState } from "./types";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";

interface AssignAssetFormFieldsProps {
  formState: AssignFormState;
  setFormState: React.Dispatch<React.SetStateAction<AssignFormState>>;
}

export const AssignAssetFormFields = memo(function AssignAssetFormFields({
  formState,
  setFormState,
}: AssignAssetFormFieldsProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      {/* Assign For */}
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-3">
        <label className="text-xs font-semibold text-slate-700 sm:text-right">
          Assign For
        </label>
        <div className="flex items-center gap-4 text-xs text-slate-700">
          {(["Full Day", "Half Day", "Hourly"] as const).map((mode) => (
            <label key={mode} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="assignFor"
                value={mode}
                checked={formState.assignFor === mode}
                onChange={() => setFormState((p) => ({ ...p, assignFor: mode }))}
                className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
              />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* From Date */}
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-3">
        <label className="text-xs font-semibold text-slate-700 sm:text-right">
          From Date <span className="text-rose-500">*</span>
        </label>
        <div className="w-full max-w-xs">
          <DatePickerDMY
            required
            value={formState.fromDate}
            onChange={(iso) => setFormState((p) => ({ ...p, fromDate: iso }))}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white w-full"
          />
        </div>
      </div>

      {/* To Date */}
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-3">
        <label className="text-xs font-semibold text-slate-700 sm:text-right pt-1.5">
          To Date <span className="text-rose-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="toDateChoice"
              checked={formState.toDateNever}
              onChange={() => setFormState((p) => ({ ...p, toDateNever: true }))}
              className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
            />
            <span>Never</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="toDateChoice"
              checked={!formState.toDateNever}
              onChange={() => setFormState((p) => ({ ...p, toDateNever: false }))}
              className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
            />
            <div className="w-full max-w-xs">
              <DatePickerDMY
                disabled={formState.toDateNever}
                value={formState.toDate}
                onChange={(iso) => setFormState((p) => ({ ...p, toDate: iso }))}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white disabled:bg-slate-100 disabled:text-slate-400 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remark */}
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-3">
        <label className="text-xs font-semibold text-slate-700 sm:text-right pt-1.5">
          Remark <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          value={formState.remark}
          onChange={(e) => setFormState((p) => ({ ...p, remark: e.target.value }))}
          placeholder="Remark"
          className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white resize-none"
        />
      </div>
    </div>
  );
});
