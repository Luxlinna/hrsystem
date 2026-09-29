import React, { useState, useEffect } from "react";
import { FormRow } from "../profile/FormRow";
import type { Department, DepartmentFormState } from "../../types";
import type { HeadOfDepartmentOption } from "../../hooks/useDepartments";

interface CreateOrEditDepartmentFormProps {
  editingDepartment: Department | null;
  departments: Department[];
  employees: HeadOfDepartmentOption[];
  isReadOnly?: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: DepartmentFormState) => Promise<void>;
  onSwitchToEdit?: () => void;
}

export function CreateOrEditDepartmentForm({
  editingDepartment,
  departments,
  employees,
  isReadOnly = false,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditDepartmentFormProps) {
  const [form, setForm] = useState<DepartmentFormState>(() => ({
    name: editingDepartment?.name || "",
    parent_department_id: editingDepartment?.parent_department_id || "",
    parent_department_name: editingDepartment?.parent_department_name || "",
    head_of_department_id: editingDepartment?.head_of_department_id || "",
    head_of_department_name: editingDepartment?.head_of_department_name || "",
    sort_order: String(editingDepartment?.sort_order ?? 0),
    status: (editingDepartment?.status as "active" | "disabled") || "active",
  }));

  useEffect(() => {
    if (editingDepartment) {
      setForm({
        name: editingDepartment.name || "",
        parent_department_id: editingDepartment.parent_department_id || "",
        parent_department_name: editingDepartment.parent_department_name || "",
        head_of_department_id: editingDepartment.head_of_department_id || "",
        head_of_department_name: editingDepartment.head_of_department_name || "",
        sort_order: String(editingDepartment.sort_order ?? 0),
        status: (editingDepartment.status as "active" | "disabled") || "active",
      });
    }
  }, [editingDepartment]);

  // Filter out self from parent options to prevent circular hierarchy
  const availableParents = departments.filter(
    (d) => !editingDepartment || d.id !== editingDepartment.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  };

  const title = isReadOnly
    ? `View Department: ${editingDepartment?.name || "Department"}`
    : editingDepartment
    ? "Edit Department"
    : "Create Department";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-medium text-slate-700 dark:text-slate-200">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {isReadOnly && onSwitchToEdit && (
            <button
              type="button"
              onClick={onSwitchToEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-edit-line text-xs" />
              <span>Edit Department</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {isReadOnly ? (
        /* READ-ONLY VIEW MODE */
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              Department Info
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Department Name
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-normal">
                  {editingDepartment?.name || form.name || "—"}
                </span>
              </div>
              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Parent Department
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-normal">
                  {editingDepartment?.parent_department_name || form.parent_department_name || "—"}
                </span>
              </div>
              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Head of Department
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-normal">
                  {editingDepartment?.head_of_department_name || form.head_of_department_name || "—"}
                </span>
              </div>
              <div className="flex items-center py-1">
                <span className="w-48 sm:w-64 text-slate-600 dark:text-slate-400 font-normal">
                  Sort Order
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-normal">
                  {editingDepartment?.sort_order ?? form.sort_order ?? "0"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT FORM MODE */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* DEPARTMENT INFO */}
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
              Department Info
            </h3>

            {/* Department Name */}
            <FormRow label="Department Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Department Name"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
            </FormRow>

            {/* Parent Department */}
            <FormRow label="Parent Department">
              <div className="relative flex items-center w-full">
                <select
                  value={form.parent_department_id || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parent = availableParents.find((p) => p.id === val);
                    setForm((prev) => ({
                      ...prev,
                      parent_department_id: val,
                      parent_department_name: parent ? parent.name : "",
                    }));
                  }}
                  className="w-full px-3 py-1.5 pr-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
                >
                  <option value="">Select</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
                {form.parent_department_id && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        parent_department_id: "",
                        parent_department_name: "",
                      }))
                    }
                    className="absolute right-6 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear"
                  >
                    <i className="ri-close-line text-xs" />
                  </button>
                )}
              </div>
            </FormRow>

            {/* Head of Department */}
            <FormRow label="Head of Department">
              <div className="relative flex items-center w-full">
                <select
                  value={form.head_of_department_id || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const emp = employees.find((em) => em.id === val);
                    setForm((prev) => ({
                      ...prev,
                      head_of_department_id: val,
                      head_of_department_name: emp ? emp.name : "",
                    }));
                  }}
                  className="w-full px-3 py-1.5 pr-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
                >
                  <option value="">Search...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.role ? `(${emp.role})` : ""}
                    </option>
                  ))}
                </select>
                {form.head_of_department_id && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        head_of_department_id: "",
                        head_of_department_name: "",
                      }))
                    }
                    className="absolute right-6 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear"
                  >
                    <i className="ri-close-line text-xs" />
                  </button>
                )}
              </div>
            </FormRow>

            {/* Sort Order */}
            <FormRow label="Sort Order">
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
            </FormRow>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-sm" />
                  <span>Save</span>
                  <i className="ri-arrow-down-s-line text-xs" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-sm" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
