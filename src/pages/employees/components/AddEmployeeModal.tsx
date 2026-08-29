import { memo, useState, useEffect } from "react";
import type { Branch, Employee, EmployeeFormState } from "../types";
import { DEPARTMENTS } from "../constants";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";

interface WorkLocation {
  id: string;
  name: string;
  is_default: boolean;
}

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
  const { visibleBranches } = useBranchScope();

  if (!isOpen) return null;

  // Fetch work sites whenever selected branch changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [workSites, setWorkSites] = useState<WorkLocation[]>([]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!form.branch_id) { setWorkSites([]); return; }
    supabase
      .from("work_locations")
      .select("id, name, is_default")
      .eq("branch_id", form.branch_id)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => {
        const sites = (data as WorkLocation[]) || [];
        setWorkSites(sites);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.branch_id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Employee</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add staff who already work here directly into the directory
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-gray-500 text-xl" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title / Role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Software Engineer"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              <select
                value={form.branch_id || ""}
                disabled={isSuperAdmin === false}
                onChange={(e) => {
                  const bId = e.target.value;
                  setForm((p) => ({ ...p, branch_id: bId, default_work_location_id: "" }));
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                {isSuperAdmin && <option value="">Headquarters / Unassigned</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {isSuperAdmin === false && (
                <p className="text-[11px] text-[#253C7D] font-bold mt-1.5 flex items-center gap-1">
                  <i className="ri-lock-line" /> Auto-assigned to your branch
                </p>
              )}
            </div>

            {/* Default Work Site — only shown when branch has work_locations */}
            {workSites.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="ri-building-2-line mr-1 text-[#253C7D]" />
                  Default Work Site
                </label>
                <select
                  value={form.default_work_location_id}
                  onChange={(e) => setForm({ ...form, default_work_location_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer"
                >
                  <option value="">
                    {visibleBranches.find((b) => b.id === form.branch_id)?.name || "Headquarters"} (Main Office)
                  </option>
                  {workSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.is_default ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Which site does this employee normally work at? Used to auto-fill attendance records.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reports To</label>
              <select
                value={form.reports_to}
                onChange={(e) => setForm({ ...form, reports_to: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="">No manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.first_name} {manager.last_name} — {manager.department || "No department"}
                  </option>
                ))}
              </select>
              {managers.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">No managers are available in the directory.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
              <input
                type="date"
                value={form.join_date}
                onChange={(e) => setForm({ ...form, join_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-[#253C7D] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3066] transition-colors disabled:opacity-60 cursor-pointer shadow-lg shadow-[#253C7D]/20"
            >
              {submitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
