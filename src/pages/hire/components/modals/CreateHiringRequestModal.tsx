import { memo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { CreateHiringRequestFields } from "./CreateHiringRequestFields";

interface CreateHiringRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  departments: string[];
  employees?: SearchableEmployee[];
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  userBranchId?: string | null;
  userBranchName?: string | null;
  targetBranch?: string | null;
}

export const CreateHiringRequestModal = memo(function CreateHiringRequestModal({
  isOpen,
  onClose,
  form,
  setForm,
  branches,
  departments,
  employees = [],
  submitting,
  onSubmit,
  isSuperAdmin = true,
  isBranchAdmin = false,
  userBranchId,
  userBranchName,
  targetBranch,
}: CreateHiringRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-white to-transparent">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-1">
              <i className="ri-file-list-3-line" /> Requisition Record
            </div>
            <h2 className="text-xl font-bold text-gray-900">New Hiring Requisition</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Submit a complete 17-field enterprise hiring requisition for executive review and live posting
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          <CreateHiringRequestFields
            form={form}
            setForm={setForm}
            branches={branches}
            departments={departments}
            employees={employees}
            isSuperAdmin={isSuperAdmin}
            isBranchAdmin={isBranchAdmin}
            userBranchId={userBranchId}
            userBranchName={userBranchName}
            targetBranch={targetBranch}
          />

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-fill" /> Submit Requisition
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
