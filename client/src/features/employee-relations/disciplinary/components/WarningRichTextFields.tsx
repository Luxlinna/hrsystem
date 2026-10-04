import { memo } from "react";
import type { NewRecord } from "../types";
import { RichTextEditor } from "./RichTextEditor";

interface WarningRichTextFieldsProps {
  newRecord: NewRecord;
  handleFieldChange: (field: keyof NewRecord, value: any) => void;
}

export const WarningRichTextFields = memo(function WarningRichTextFields({
  newRecord,
  handleFieldChange,
}: WarningRichTextFieldsProps) {
  return (
    <>
      {/* Description of Violation */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-5">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
          Description of Violation <span className="text-rose-500">*</span>
        </label>
        <div className="flex-1 max-w-3xl">
          <RichTextEditor
            value={newRecord.description || ""}
            onChange={(val) => handleFieldChange("description", val)}
            placeholder=""
            minHeight="140px"
          />
        </div>
      </div>

      {/* Action to Be Taken */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-5">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
          Action to Be Taken <span className="text-rose-500">*</span>
        </label>
        <div className="flex-1 max-w-3xl">
          <RichTextEditor
            value={newRecord.action_to_take || newRecord.action_taken || ""}
            onChange={(val) => {
              handleFieldChange("action_to_take", val);
              handleFieldChange("action_taken", val);
            }}
            placeholder=""
            minHeight="140px"
          />
        </div>
      </div>

      {/* Employee Promise */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-5">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
          Employee Promise <span className="text-rose-500">*</span>
        </label>
        <div className="flex-1 max-w-3xl">
          <RichTextEditor
            value={newRecord.employee_promise || ""}
            onChange={(val) => handleFieldChange("employee_promise", val)}
            placeholder=""
            minHeight="140px"
          />
        </div>
      </div>

      {/* Remark */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-4">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right sm:pt-2">
          Remark
        </label>
        <div className="w-full sm:w-[350px]">
          <textarea
            rows={2}
            value={newRecord.remark || newRecord.notes || ""}
            onChange={(e) => {
              handleFieldChange("remark", e.target.value);
              handleFieldChange("notes", e.target.value);
            }}
            placeholder="Remark"
            className="w-full p-2.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all resize-y"
          />
        </div>
      </div>
    </>
  );
});
