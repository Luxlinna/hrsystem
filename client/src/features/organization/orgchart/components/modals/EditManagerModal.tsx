import { memo } from "react";
import type { Employee } from "../../types";
import { getDescendantIds } from "../../orgChartUtils";

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployee: Employee | null;
  employees: Employee[];
  newManagerId: string;
  setNewManagerId: (id: string) => void;
  saving: boolean;
  onSave: () => Promise<void>;
}

export const EditManagerModal = memo(function EditManagerModal({
  isOpen,
  onClose,
  selectedEmployee,
  employees,
  newManagerId,
  setNewManagerId,
  saving,
  onSave,
}: EditManagerModalProps) {
  if (!isOpen || !selectedEmployee) return null;

  const descendantIds = getDescendantIds(selectedEmployee.id, employees);
  const eligibleManagers = employees.filter(
    (e) => e.id !== selectedEmployee.id && !descendantIds.has(e.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-transparent dark:border-slate-800 animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-slate-100 mb-1">
          Edit Reporting Relationship
        </h3>
        <p className="text-[12px] text-gray-500 dark:text-slate-400 mb-5">
          Set who{" "}
          <span className="font-semibold text-gray-700 dark:text-slate-200">
            {selectedEmployee.first_name} {selectedEmployee.last_name}
          </span>{" "}
          reports to
        </p>

        <div className="mb-5">
          <label className="text-[12px] font-semibold text-gray-600 dark:text-slate-300 mb-1.5 block">
            Reports To
          </label>
          <select
            value={newManagerId}
            onChange={(e) => setNewManagerId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[13px] text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500 cursor-pointer"
          >
            <option value="none" className="dark:bg-slate-800">— No manager (Top level)</option>
            {eligibleManagers.map((e) => (
              <option key={e.id} value={e.id} className="dark:bg-slate-800">
                {e.first_name} {e.last_name} — {e.role}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-[13px] font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#253C7D] dark:bg-blue-600 text-white text-[13px] font-semibold rounded-xl hover:bg-[#1F336A] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
});
