import { memo, useCallback, useEffect } from "react";
import type { EmployeeExit, ExitFormState } from "../types";
import { useExitEmployeeSearch } from "../hooks/useExitEmployeeSearch";
import { useExitFormOptions } from "../hooks/useExitFormOptions";
import { ExitEmployeeSection } from "./modal/ExitEmployeeSection";
import { ExitInfoSection } from "./modal/ExitInfoSection";
import { ExitContractSection } from "./modal/ExitContractSection";
import { ExitSeveranceSection } from "./modal/ExitSeveranceSection";
import { ExitAttachmentSection } from "./modal/ExitAttachmentSection";

interface ExitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: EmployeeExit | null;
  form: ExitFormState;
  setForm: React.Dispatch<React.SetStateAction<ExitFormState>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
  branchId: string | null;
  branchName: string | null;
}

export const ExitFormModal = memo(function ExitFormModal({
  isOpen,
  onClose,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onUploadDocument,
  branchId,
  branchName,
}: ExitFormModalProps) {
  const { results, searching, search } = useExitEmployeeSearch(branchId);
  const { exitTypes, reasonTypes, refreshOptions } = useExitFormOptions();

  const handleChange = useCallback((field: keyof ExitFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, [setForm]);

  const handleSearchEmployees = useCallback((q: string) => {
    search(q, branchId);
  }, [search, branchId]);

  useEffect(() => {
    if (isOpen) {
      search("", branchId);
      refreshOptions();
    }
  }, [isOpen, branchId, search, refreshOptions]);

  if (!isOpen) return null;

  const currentEmpName = editing?.employees
    ? `${editing.employees.first_name} ${editing.employees.last_name}`.trim()
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {editing ? "Edit Exit Requirement Form" : "Exit Requirement Form"}
            </h3>
            {branchName && (
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Business Unit: <span className="text-[#253C7D] font-bold">{branchName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            <ExitEmployeeSection
              form={form}
              onChange={handleChange}
              results={results}
              searching={searching}
              onSearch={handleSearchEmployees}
              editing={Boolean(editing)}
              currentEmployeeName={currentEmpName}
            />

            <ExitInfoSection
              form={form}
              onChange={handleChange}
              exitTypes={exitTypes}
              reasonTypes={reasonTypes}
            />

            <ExitContractSection
              form={form}
              onChange={handleChange}
            />

            <ExitSeveranceSection
              form={form}
              onChange={handleChange}
            />

            <ExitAttachmentSection
              form={form}
              onChange={handleChange}
              onUploadDocument={onUploadDocument}
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-slate-500">
              Employee status will be set to <span className="font-bold text-rose-600">Inactive</span> upon saving
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.employee_id}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "#253C7D" }}
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <i className="ri-check-line text-sm" />
                {editing ? "Save Changes" : "Submit Exit Form"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
