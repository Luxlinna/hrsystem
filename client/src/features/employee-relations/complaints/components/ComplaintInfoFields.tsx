import React, { memo } from "react";
import type { ComplaintFormState } from "../types";
import { RichTextEditor } from "@/features/employee-relations/disciplinary/components/RichTextEditor";
import { ComplaintRecipientField } from "./ComplaintRecipientField";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";
import { useComplaintOrgData } from "../hooks/useComplaintOrgData";

interface ComplaintInfoFieldsProps {
  form: ComplaintFormState;
  setForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  branchId?: string | null;
  branchName?: string | null;
}

export const ComplaintInfoFields = memo(function ComplaintInfoFields({
  form,
  setForm,
  branchId,
}: ComplaintInfoFieldsProps) {
  const { buDepartments, buDivisions } = useComplaintOrgData(branchId);

  const updateField = <K extends keyof ComplaintFormState>(field: K, value: ComplaintFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === "Department") {
      setForm((prev) => ({
        ...prev,
        target_category: "Department",
        target_to: buDepartments[0] || "",
        employee_id: "",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        target_category: "Division",
        target_to: buDivisions[0] || "",
        employee_id: "",
      }));
    }
  };

  return (
    <div>
      <div className="text-sm font-bold text-[#253C7D] uppercase tracking-wide">
        COMPLAINT/SUGGESTION INFO
      </div>
      <div className="border-b border-slate-200 mt-2 mb-6" />

      <div className="space-y-5">
        {/* Filing Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
            Filing Date <span className="text-rose-500">*</span>
          </label>
          <div className="w-full sm:w-[350px]">
            <DatePickerDMY
              required
              value={form.entry_date}
              onChange={(iso) => updateField("entry_date", iso)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Complaint/Suggestion To (Division / Department) */}
        <ComplaintRecipientField
          form={form}
          updateField={updateField}
          buDivisions={buDivisions}
          buDepartments={buDepartments}
          onCategoryChange={handleCategoryChange}
        />

        {/* Subject */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
            Complaint/Suggestion Subject <span className="text-rose-500">*</span>
          </label>
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              required
              placeholder="Complaint/Suggestion Subject"
              value={form.subject}
              onChange={(e) => updateField("subject", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Detail */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
            Complaint/Suggestion Detail <span className="text-rose-500">*</span>
          </label>
          <div className="flex-1 max-w-2xl">
            <RichTextEditor
              value={form.details}
              onChange={(val) => updateField("details", val)}
              placeholder="Provide detailed description..."
              minHeight="140px"
            />
          </div>
        </div>

        {/* Suggestion */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
            Suggestion
          </label>
          <div className="flex-1 max-w-2xl">
            <RichTextEditor
              value={form.suggestion}
              onChange={(val) => updateField("suggestion", val)}
              placeholder="Provide constructive suggestions..."
              minHeight="140px"
            />
          </div>
        </div>

        {/* Remark */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
            Remark
          </label>
          <div className="flex-1 max-w-2xl">
            <textarea
              rows={2}
              placeholder="Remark"
              value={form.remark}
              onChange={(e) => updateField("remark", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
