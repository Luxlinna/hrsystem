import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";

export const ProfileDemographicFields = memo(function ProfileDemographicFields({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  return (
    <>
      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Gender
        </label>
        {editing ? (
          <select
            value={form.gender || "Male"}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.gender || "—"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Date of Birth
        </label>
        {editing ? (
          <input
            type="date"
            value={form.date_of_birth || ""}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-mono font-bold">
            {employee.date_of_birth || "—"}
          </p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Marital Status
        </label>
        {editing ? (
          <select
            value={form.marital_status || "Single"}
            onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.marital_status || "Single"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Nationality
        </label>
        {editing ? (
          <input
            value={form.nationality || "Khmer"}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.nationality || "Khmer"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Religion
        </label>
        {editing ? (
          <input
            value={form.religion || "None"}
            onChange={(e) => setForm({ ...form, religion: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.religion || "None"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Blood Group
        </label>
        {editing ? (
          <select
            value={form.blood_group || "None"}
            onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="None">None</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        ) : (
          <p className="text-xs text-gray-900 font-bold">{employee.blood_group || "None"}</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Resident Status
        </label>
        {editing ? (
          <select
            value={form.is_resident !== false ? "resident" : "non-resident"}
            onChange={(e) => setForm({ ...form, is_resident: e.target.value === "resident" })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="resident">Resident Taxpayer</option>
            <option value="non-resident">Non-Resident</option>
          </select>
        ) : (
          <span
            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
              employee.is_resident !== false
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {employee.is_resident !== false ? "Resident Taxpayer" : "Non-Resident"}
          </span>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Fringe Benefit
        </label>
        {editing ? (
          <select
            value={form.fringe_benefit ? "eligible" : "none"}
            onChange={(e) => setForm({ ...form, fringe_benefit: e.target.value === "eligible" })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          >
            <option value="none">None</option>
            <option value="eligible">Eligible</option>
          </select>
        ) : (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {employee.fringe_benefit ? "Eligible" : "None"}
          </span>
        )}
      </div>
    </>
  );
});
