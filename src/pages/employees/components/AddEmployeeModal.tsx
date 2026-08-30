import { memo, useState, useEffect } from "react";
import type { Branch, Employee, EmployeeFormState } from "../types";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { AddEmployeeModalFields, type WorkLocation } from "./AddEmployeeModalFields";

interface AddEmployeeModalProps {
  isOpen: boolean;
  form: EmployeeFormState;
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>;
  branches: Branch[];
  managers: Employee[];
  submitting: boolean;
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddEmployeeModal = memo(function AddEmployeeModal({
  isOpen,
  form,
  setForm,
  branches,
  managers,
  submitting,
  isSuperAdmin = true,
  onClose,
  onSubmit,
}: AddEmployeeModalProps) {
  const { visibleBranches, targetBranch, userBranchId } = useBranchScope();
  const [workSites, setWorkSites] = useState<WorkLocation[]>([]);

  const rawBranchId = form.branch_id || targetBranch || userBranchId || "";
  const resolvedBranchId = rawBranchId.startsWith("site:")
    ? (visibleBranches.find((b) => b.id === rawBranchId)?.branch_id || targetBranch || userBranchId || "")
    : rawBranchId;

  useEffect(() => {
    if (isOpen && !isSuperAdmin) {
      const defaultBranch = targetBranch || userBranchId || "";
      if (defaultBranch && form.branch_id !== defaultBranch) {
        setForm((prev) => ({ ...prev, branch_id: defaultBranch }));
      }
    }
  }, [isOpen, isSuperAdmin, targetBranch, userBranchId, form.branch_id, setForm]);

  useEffect(() => {
    if (!resolvedBranchId || !isOpen) {
      setWorkSites([]);
      return;
    }
    supabase
      .from("work_locations")
      .select("id, name, is_default")
      .eq("branch_id", resolvedBranchId)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => {
        setWorkSites((data as WorkLocation[]) || []);
      });
  }, [resolvedBranchId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Employee</h2>
            <p className="text-xs text-gray-500 mt-1">
              Add staff directly into the employee directory
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-gray-500 text-xl" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <AddEmployeeModalFields
            form={form}
            setForm={setForm}
            branches={branches}
            visibleBranches={visibleBranches}
            managers={managers}
            workSites={workSites}
            isSuperAdmin={isSuperAdmin}
          />

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
