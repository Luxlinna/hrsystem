import { memo } from "react";

interface AddEmployeeHeaderProps {
  onClose: () => void;
  isEdit?: boolean;
}

export const AddEmployeeHeader = memo(function AddEmployeeHeader({
  onClose,
  isEdit = false,
}: AddEmployeeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-slate-200 bg-white">
      <h1 className="text-base sm:text-lg font-normal text-slate-700 tracking-tight">
        {isEdit ? "Edit Employee" : "Create Employee"}
      </h1>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-left-s-line text-sm" />
        <span>Back</span>
      </button>
    </div>
  );
});
