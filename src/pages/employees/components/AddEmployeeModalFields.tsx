import { memo } from "react";
import type { Branch, Employee, EmployeeFormState } from "../types";
import { DEPARTMENTS, STATUS_OPTIONS } from "../constants";

export interface WorkLocation {
  id: string;
  name: string;
  is_default: boolean;
}

interface AddEmployeeModalFieldsProps {
  form: EmployeeFormState;
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>;
  branches: Branch[];
  visibleBranches: any[];
  managers: Employee[];
  workSites: WorkLocation[];
  isSuperAdmin: boolean;
}

export const AddEmployeeModalFields = memo(function AddEmployeeModalFields({
  form,
  setForm,
  branches,
  visibleBranches,
  managers,
  workSites,
  isSuperAdmin,
}: AddEmployeeModalFieldsProps) {
  const branchList = visibleBranches.length > 0 ? visibleBranches : branches;
  const currentBranchName =
    branchList.find((b) => b.id === form.branch_id)?.name ||
    branches.find((b) => b.id === form.branch_id)?.name ||
    "OPS sulotion";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
            placeholder="john@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Job Title / Role</label>
          <input
            type="text"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g., Software Engineer"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
          <select
            value={DEPARTMENTS.slice(0, -1).includes(form.department) ? form.department : "Other"}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                setForm({ ...form, department: "" });
              } else {
                setForm({ ...form, department: val });
              }
            }}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {!DEPARTMENTS.slice(0, -1).includes(form.department) && (
            <input
              type="text"
              required
              placeholder="Type custom department name..."
              value={form.department === "Other" ? "" : form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="mt-2 w-full px-3.5 py-2 border border-blue-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-blue-50/40 placeholder-gray-400"
              autoFocus
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Branch</label>
          {isSuperAdmin ? (
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value, default_work_location_id: "" })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
            >
              <option value="">Select Branch</option>
              {branchList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div>
              <div className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-bold text-gray-600 cursor-not-allowed select-none">
                {currentBranchName}
              </div>
              <p className="text-[11px] text-[#253C7D] font-bold mt-1.5 flex items-center gap-1.5">
                <i className="ri-lock-line text-xs" />
                <span>Auto-assigned to your branch</span>
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Reports To</label>
          <select
            value={form.reports_to}
            onChange={(e) => setForm({ ...form, reports_to: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
          >
            <option value="">No manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.role})
              </option>
            ))}
          </select>
          {managers.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-1">No managers are available in the directory.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Join Date</label>
          <input
            type="date"
            value={form.join_date}
            onChange={(e) => setForm({ ...form, join_date: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
          />
        </div>
      </div>

      {workSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Work Site / Location</label>
            <select
              value={form.default_work_location_id}
              onChange={(e) => setForm({ ...form, default_work_location_id: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
            >
              <option value="">{currentBranchName} (Main Branch)</option>
              {workSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
});
