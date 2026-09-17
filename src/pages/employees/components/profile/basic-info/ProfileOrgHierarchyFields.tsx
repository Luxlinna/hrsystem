import { memo } from "react";
import type { BasicInfoOrgProps } from "./types";

export const ProfileOrgHierarchyFields = memo(function ProfileOrgHierarchyFields({
  employee,
  form,
  setForm,
  editing,
  manager,
  allEmployees,
  branches,
}: BasicInfoOrgProps) {
  return (
    <>
      {/* Business Unit (BU) */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Business Unit (BU)
        </label>
        {editing && branches && branches.length > 0 ? (
          <select
            value={form.branch_id || employee.branch_id || ""}
            onChange={(e) => {
              const bId = e.target.value || null;
              const selectedBranch = branches.find((b) => b.id === bId);
              setForm({
                ...form,
                branch_id: bId,
                bu_full_name: selectedBranch?.name || null,
                reports_to: null,
                line_manager: null,
              });
            }}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="">-- Select Business Unit --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black text-[#253C7D]">
              {employee.bu_full_name || employee.branches?.name || "OPS sulotion"}
            </span>
            {employee.code_bu && (
              <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-blue-100 text-[#253C7D]">
                [{employee.code_bu}]
              </span>
            )}
            {employee.handle_bu && (
              <span className="text-[10px] text-slate-400 font-mono">{employee.handle_bu}</span>
            )}
          </div>
        )}
      </div>

      {/* Department */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Department
        </label>
        {editing ? (
          <input
            value={form.department || ""}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.department || "IT"}</p>
        )}
      </div>

      {/* Position / Role */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Position &amp; Role
        </label>
        {editing ? (
          <input
            value={form.position || form.role || ""}
            onChange={(e) =>
              setForm({ ...form, position: e.target.value, role: e.target.value })
            }
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.position || employee.role}</p>
        )}
      </div>

      {/* Line Manager */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Line Manager (Reporting Line)
          </label>
          {editing && (
            <span className="text-[10px] font-bold text-[#253C7D]">
              {allEmployees.length} in this BU
            </span>
          )}
        </div>
        {editing ? (
          <select
            value={form.reports_to || ""}
            onChange={(e) => {
              const val = e.target.value || null;
              const matched = allEmployees.find((m) => m.id === val);
              setForm({
                ...form,
                reports_to: val,
                line_manager: matched ? `${matched.first_name} ${matched.last_name}`.trim() : null,
              });
            }}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="">No manager</option>
            {allEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name} — {e.role}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-1.5">
            <i className="ri-user-star-line text-[#253C7D] text-xs" />
            <span className="text-xs font-bold text-slate-900">
              {manager
                ? `${manager.first_name} ${manager.last_name} (${manager.role})`
                : employee.line_manager || "No manager"}
            </span>
          </div>
        )}
      </div>
    </>
  );
});
