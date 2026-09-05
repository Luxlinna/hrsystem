import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee, ReportEntry } from "../../types";

interface BasicInfoCardProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
  saving: boolean;
  manager: ReportEntry | null;
  allEmployees: ReportEntry[];
  branches?: { id: string; name: string }[];
  workSites?: { id: string; name: string; branch_id: string }[];
  onSave: () => void;
}

export const BasicInfoCard = memo(function BasicInfoCard({
  employee,
  form,
  setForm,
  editing,
  saving,
  manager,
  allEmployees,
  branches = [],
  workSites = [],
  onSave,
}: BasicInfoCardProps) {
  // Filter sites for the currently selected branch in the form
  const currentBranchId = form.branch_id || employee.branch_id;
  const availableSites = workSites.filter((s) => !currentBranchId || s.branch_id === currentBranchId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#1A1A1A]">Profile Information</h2>
        {editing && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
          {editing ? (
            <input
              value={form.first_name || ""}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900 font-medium">{employee.first_name}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
          {editing ? (
            <input
              value={form.last_name || ""}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900 font-medium">{employee.last_name}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Email
          </label>
          {editing ? (
            <input
              type="email"
              value={form.email || ""}
              placeholder="Optional (Biometric only)"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900">
              {employee.email || <span className="text-gray-400 italic text-xs">No email (Biometric only)</span>}
            </p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
          {editing ? (
            <input
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900">{employee.phone || "—"}</p>
          )}
        </div>

        {/* Branch Selection */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Branch</label>
          {editing ? (
            <select
              value={form.branch_id || ""}
              onChange={(e) => {
                const newBranchId = e.target.value || null;
                setForm({
                  ...form,
                  branch_id: newBranchId,
                  // Reset site if changing branch
                  default_work_location_id: null,
                });
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">No branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5">
              <i className="ri-building-line text-[#253C7D] text-sm" />
              <p className="text-[14px] text-gray-900 font-medium">{employee.branches?.name || "No branch"}</p>
            </div>
          )}
        </div>

        {/* Work Site / Location */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Work Site / Location
          </label>
          {editing ? (
            <select
              value={form.default_work_location_id || ""}
              onChange={(e) => setForm({ ...form, default_work_location_id: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">
                {branches.find((b) => b.id === currentBranchId)?.name || employee.branches?.name || "Main Branch"} (Main Branch)
              </option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5">
              <i className="ri-map-pin-2-line text-emerald-600 text-sm" />
              <p className="text-[14px] text-gray-900 font-medium">
                {employee.work_locations?.name || `${employee.branches?.name || "Main Branch"} (Main Branch)`}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</label>
          {editing ? (
            <input
              value={form.role || ""}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900">{employee.role}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Department</label>
          {editing ? (
            <input
              value={form.department || ""}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900">{employee.department}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Join Date</label>
          {editing ? (
            <input
              type="date"
              value={form.join_date || ""}
              onChange={(e) => setForm({ ...form, join_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]"
            />
          ) : (
            <p className="text-[14px] text-gray-900">{employee.join_date || "—"}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</label>
          {editing ? (
            <select
              value={form.status || ""}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          ) : (
            <p className="text-[14px] text-gray-900 capitalize">{employee.status}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reports To</label>
          {editing ? (
            <select
              value={form.reports_to || ""}
              onChange={(e) => setForm({ ...form, reports_to: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">No manager</option>
              {allEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} — {e.role}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              {manager ? (
                <>
                  <Link
                    to={`/employees/${manager.id}`}
                    className="text-[14px] text-[#253C7D] font-medium hover:underline flex items-center gap-1"
                  >
                    <i className="ri-user-line" />
                    {manager.first_name} {manager.last_name}
                  </Link>
                  <span className="text-[12px] text-gray-400">({manager.role})</span>
                </>
              ) : (
                <p className="text-[14px] text-gray-500">No manager assigned</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
