import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { BasicInfoOrgProps } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";

export const ProfileOrgHierarchyFields = memo(function ProfileOrgHierarchyFields({
  employee,
  form,
  setForm,
  editing,
  manager,
  allEmployees,
  branches,
}: BasicInfoOrgProps) {
  const [dbDivisions, setDbDivisions] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("divisions")
      .select("name, status")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbDivisions(
            Array.from(
              new Set(
                data
                  .filter((d) => !d.status || d.status !== "disabled")
                  .map((d) => d.name.trim())
                  .filter(Boolean)
              )
            )
          );
        }
      });
  }, []);

  const allDivisionOptions = Array.from(
    new Set([
      ...(form.division ? [form.division] : []),
      ...(employee.division ? [employee.division] : []),
      ...dbDivisions,
    ])
  );
  return (
    <>
      {/* Business Unit (BU) */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Business Unit (BU)
        </label>
        {editing && branches && branches.length > 0 ? (
          <SearchableSelect
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={form.branch_id || employee.branch_id || ""}
            onChange={(bId) => {
              const selectedBranch = branches.find((b) => b.id === bId);
              setForm({
                ...form,
                branch_id: bId || null,
                bu_full_name: selectedBranch?.name || null,
                reports_to: null,
                line_manager: null,
              });
            }}
            placeholder="Select Business Unit"
            searchPlaceholder="Search BU..."
            showClear
          />
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

      {/* Division */}
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Division
        </label>
        {editing ? (
          <SearchableSelect
            options={allDivisionOptions}
            value={form.division || employee.division || ""}
            onChange={(val) => setForm({ ...form, division: val })}
            placeholder="Select Division"
            searchPlaceholder="Search division..."
            showClear
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.division || "—"}</p>
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
          <SearchableSelect
            options={allEmployees.map((e) => ({
              value: e.id,
              label: `${e.first_name} ${e.last_name}`,
              sublabel: e.role || e.department || "",
            }))}
            value={form.reports_to || ""}
            onChange={(val) => {
              const matched = allEmployees.find((m) => m.id === val);
              setForm({
                ...form,
                reports_to: val || null,
                line_manager: matched ? `${matched.first_name} ${matched.last_name}`.trim() : null,
              });
            }}
            placeholder="Select Line Manager"
            searchPlaceholder="Search manager..."
            showClear
          />
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
