import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalIdentityFields = memo(function PersonalIdentityFields({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleNameChange = (first: string, last: string) => {
    onChange("first_name", first);
    onChange("last_name", last);
    const full = `${first} ${last}`.trim();
    onChange("full_name", full);

    const format = form.display_name_format || "first_last";
    if (format === "last_first") {
      onChange("display_name", `${last} ${first}`.trim());
    } else {
      onChange("display_name", full);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Title */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Title <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.title || "Mr"}
            onChange={(e) => onChange("title", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
            <option value="Prof">Prof</option>
          </select>
        </div>
      </div>

      {/* 2. First Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          First Name <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => handleNameChange(e.target.value, form.last_name)}
            placeholder="First Name"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* 3. Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Last Name <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => handleNameChange(form.first_name, e.target.value)}
            placeholder="Last Name"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* 4. Display Name as */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Display Name as <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.display_name_format || "first_last"}
            onChange={(e) => {
              const fmt = e.target.value;
              onChange("display_name_format", fmt);
              if (fmt === "last_first") {
                onChange("display_name", `${form.last_name} ${form.first_name}`.trim());
              } else {
                onChange("display_name", `${form.first_name} ${form.last_name}`.trim());
              }
            }}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="first_last">
              {form.first_name || form.last_name ? `${form.first_name} ${form.last_name}`.trim() : "First Name Last Name"}
            </option>
            <option value="last_first">
              {form.first_name || form.last_name ? `${form.last_name} ${form.first_name}`.trim() : "Last Name First Name"}
            </option>
          </select>
        </div>
      </div>

      {/* 5. Foreign Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Foreign Name
        </label>
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={form.foreign_name}
            onChange={(e) => onChange("foreign_name", e.target.value)}
            placeholder="Foreign Name"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
          <select
            value={form.foreign_name_format || "last_first"}
            onChange={(e) => onChange("foreign_name_format", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="last_first">Last Name First Name</option>
            <option value="first_last">First Name Last Name</option>
          </select>
        </div>
      </div>

      {/* Khmer Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Khmer Name (KH Name)
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.kh_name}
            onChange={(e) => onChange("kh_name", e.target.value)}
            placeholder="ឈ្មោះជាភាសាខ្មែរ (e.g. សុខ តារា)"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Employee Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Employee Code <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.employee_code || form.biometric_user_id || ""}
            onChange={(e) => {
              onChange("employee_code", e.target.value);
              onChange("biometric_user_id", e.target.value);
            }}
            placeholder="Auto Employee Code"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
