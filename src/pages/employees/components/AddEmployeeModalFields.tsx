import { memo, useState, useEffect } from "react";
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
  const cleanBranches = branchList.filter((b) => !b.is_site && !b.id.startsWith("site:"));
  const currentBranchName =
    cleanBranches.find((b) => b.id === form.branch_id)?.name ||
    branches.find((b) => b.id === form.branch_id)?.name ||
    "OPS sulotion";

  const [contactType, setContactType] = useState<"email" | "phone">(() =>
    form.phone && !form.email ? "phone" : "email"
  );

  useEffect(() => {
    if (form.phone && !form.email) {
      setContactType("phone");
    } else if (form.email && !form.phone) {
      setContactType("email");
    }
  }, [form.email, form.phone]);

  const handleSwitchContactType = (type: "email" | "phone") => {
    setContactType(type);
    if (type === "phone") {
      if (form.email && !form.phone) {
        setForm((prev) => ({ ...prev, phone: prev.email, email: "" }));
      }
    } else {
      if (form.phone && !form.email) {
        setForm((prev) => ({ ...prev, email: prev.phone, phone: "" }));
      }
    }
  };

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
        {/* Single Contact Field (Email or Phone) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-gray-700">
              {contactType === "email" ? "Email" : "Phone Number"}
            </label>
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => handleSwitchContactType("email")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  contactType === "email"
                    ? "bg-white text-[#253C7D] shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="ri-mail-line text-[11px]" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchContactType("phone")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  contactType === "phone"
                    ? "bg-white text-[#253C7D] shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <i className="ri-phone-line text-[11px]" />
                <span>Phone</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <i className={contactType === "email" ? "ri-mail-line text-xs" : "ri-phone-line text-xs"} />
            </div>
            <input
              type={contactType === "email" ? "email" : "tel"}
              value={contactType === "email" ? form.email : form.phone}
              onChange={(e) => {
                const val = e.target.value;
                if (contactType === "phone") {
                  if (val.includes("@")) {
                    setContactType("email");
                    setForm((prev) => ({ ...prev, email: val, phone: "" }));
                  } else {
                    setForm((prev) => ({ ...prev, phone: val, email: "" }));
                  }
                } else {
                  setForm((prev) => ({ ...prev, email: val, phone: "" }));
                }
              }}
              className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
              placeholder={
                contactType === "email"
                  ? "john@company.com"
                  : "+855 12 345 678 or +1 (555) 000-0000"
              }
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Skip if employee has neither. Staff without an email or phone number cannot log in or use this system.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* 2-Part Branch & Location Assignment */}
      <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D]">
              <i className="ri-building-2-line text-sm" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 tracking-wide uppercase">Branch & Location Assignment</h4>
              <p className="text-[11px] text-gray-500">Separated into 2 parts: Main Branch and Sub-Branch/Site</p>
            </div>
          </div>
          {workSites.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
              <i className="ri-map-pin-line text-[10px]" />
              {workSites.length} Sub-Branch{workSites.length > 1 ? "es" : ""} Available
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Part 1: Main Branch */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Part 1: Main Branch *
            </label>
            {isSuperAdmin ? (
              <select
                required
                value={form.branch_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, branch_id: val, default_work_location_id: "" });
                }}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer"
              >
                <option value="">Select Main Branch</option>
                {cleanBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <div className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-xl text-xs font-bold text-gray-700 select-none">
                  {currentBranchName}
                </div>
                <p className="text-[11px] text-[#253C7D] font-bold mt-1.5 flex items-center gap-1.5">
                  <i className="ri-lock-line text-xs" />
                  <span>Auto-assigned to your main branch</span>
                </p>
              </div>
            )}
          </div>

          {/* Part 2: Sub-Branch / Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Part 2: Sub-Branch / Work Location
            </label>
            {workSites.length > 0 ? (
              <select
                value={form.default_work_location_id || ""}
                onChange={(e) => setForm({ ...form, default_work_location_id: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-emerald-300 bg-emerald-50/20 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D] cursor-pointer"
              >
                <option value="">Main Office ({currentBranchName})</option>
                {workSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    📍 {site.name} (Sub-Branch)
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3.5 py-2.5 bg-gray-100/70 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Main Office ({currentBranchName})</span>
                <span className="text-[10px] text-gray-400">No sub-branches</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
              {workSites.length > 0
                ? "Select specific sub-branch/site (e.g. KampongThom) or keep as Main Office."
                : "This branch operates only at its main office location."}
            </p>
          </div>
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
    </>
  );
});
