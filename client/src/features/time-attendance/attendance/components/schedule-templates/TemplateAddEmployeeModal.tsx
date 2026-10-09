import { useState, useMemo, useCallback, memo } from "react";
import type { Employee } from "../../types";
import { useBranchScope } from "@/context/BranchContext";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignedIds: string[];
  onConfirm: (selectedIds: string[]) => void;
  siteName: string;
}

export const TemplateAddEmployeeModal = memo(function TemplateAddEmployeeModal({
  isOpen,
  onClose,
  employees,
  assignedIds,
  onConfirm,
  siteName,
}: Props) {
  const { visibleBranches } = useBranchScope();
  const [modalSearch, setModalSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState("all");

  const getBUName = useCallback((emp: Employee) => {
    if (emp.default_work_location_id) {
      const site = visibleBranches.find((b) => b.is_site && (b.id === `site:${emp.default_work_location_id}` || b.id === emp.default_work_location_id));
      if (site?.name) return `${site.name} (Site)`;
    }
    if (emp.branches?.name) return emp.branches.name;
    if (emp.branch_id) {
      const b = visibleBranches.find((br) => !br.is_site && br.id === emp.branch_id);
      if (b?.name) return b.name;
    }
    return siteName && siteName !== "All" ? siteName : "";
  }, [visibleBranches, siteName]);

  const filtered = useMemo(() => {
    const q = modalSearch.toLowerCase();
    return employees.filter((emp) => {
      const name = formatKhmerFullName(emp).toLowerCase();
      const code = (emp.employee_code || emp.biometric_user_id || "").toLowerCase();
      const dept = (emp.department || "").toLowerCase();
      const matchSearch = !q || name.includes(q) || code.includes(q) || dept.includes(q);
      const buName = getBUName(emp);
      const matchBranch = branchFilter === "all" || buName.toLowerCase().includes(branchFilter.toLowerCase());
      return matchSearch && matchBranch;
    });
  }, [employees, modalSearch, branchFilter, getBUName]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedIds);
    setSelectedIds([]);
    setModalSearch("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
              Add Employees to Schedule
            </h3>
            <p className="text-xs text-gray-400">
              Select staff members from the active Business Unit to assign.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, department, or code..."
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
            autoFocus
            className="flex-1 px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:border-[#253C7D] text-gray-800 dark:text-slate-100"
          />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All BUs & Sites</option>
            {visibleBranches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.is_site ? `↳ ${b.name} (Site)` : b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-50 dark:divide-slate-800">
          {filtered.map((emp) => {
            const isAssigned = assignedIds.includes(emp.id);
            const isSelected = selectedIds.includes(emp.id);
            const empBU = getBUName(emp);

            return (
              <div
                key={emp.id}
                onClick={() => {
                  if (isAssigned) return;
                  setSelectedIds((p) => p.includes(emp.id) ? p.filter((id) => id !== emp.id) : [...p, emp.id]);
                }}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                  isAssigned ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800/40"
                  : isSelected ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#253C7D] font-bold"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isAssigned || isSelected}
                    disabled={isAssigned}
                    onChange={() => {}}
                    className="rounded border-gray-300 text-[#253C7D] cursor-pointer"
                  />
                  <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(emp.display_name || emp.full_name || emp.first_name || "E")[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold">
                      {formatKhmerFullName(emp)}
                      {emp.employee_code && <span className="ml-1.5 text-[10px] font-mono text-gray-400">({emp.employee_code})</span>}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {emp.role || "Staff"} &middot; {emp.department || "General"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {empBU && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200/60 dark:border-slate-700">
                      {empBU}
                    </span>
                  )}
                  {isAssigned && <span className="text-[10px] text-gray-400 font-bold">Already Added</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-bold">
            {selectedIds.length} employee(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
