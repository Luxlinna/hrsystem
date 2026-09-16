import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";

export const ProfileIdentityFields = memo(function ProfileIdentityFields({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  return (
    <>
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Title
        </label>
        {editing ? (
          <select
            value={form.title || "Mr"}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
          </select>
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.title || "Mr"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          First Name
        </label>
        {editing ? (
          <input
            value={form.first_name || ""}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.first_name}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Last Name
        </label>
        {editing ? (
          <input
            value={form.last_name || ""}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.last_name}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Khmer Name (ឈ្មោះជាភាសាខ្មែរ)
        </label>
        {editing ? (
          <input
            value={form.kh_name || ""}
            onChange={(e) => setForm({ ...form, kh_name: e.target.value })}
            placeholder="ឈ្មោះជាភាសាខ្មែរ"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-[#253C7D] font-bold font-sans">
            {employee.kh_name || "—"}
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Display Name
        </label>
        {editing ? (
          <input
            value={form.display_name || ""}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.display_name || "—"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Foreign / Latin Name
        </label>
        {editing ? (
          <input
            value={form.foreign_name || ""}
            onChange={(e) => setForm({ ...form, foreign_name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.foreign_name || "—"}</p>
        )}
      </div>
    </>
  );
});
