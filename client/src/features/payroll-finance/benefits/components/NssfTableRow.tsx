import { useState } from "react";
import type { NssfEmployee } from "../types";

interface NssfTableRowProps {
  emp: NssfEmployee;
  onSave: (id: string, updates: Partial<NssfEmployee>) => Promise<boolean>;
  saving?: boolean;
}

export function NssfTableRow({ emp, onSave }: NssfTableRowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nssf_number: emp.nssf_number || "",
    kh_name: emp.kh_name || "",
    nationality: emp.nationality || "Cambodian",
    gender: emp.gender || "",
    date_of_birth: emp.date_of_birth || "",
    basic_salary: emp.basic_salary != null ? String(emp.basic_salary) : "",
  });
  const [rowSaving, setRowSaving] = useState(false);

  const handleSave = async () => {
    setRowSaving(true);
    const ok = await onSave(emp.id, {
      nssf_number: form.nssf_number || null,
      kh_name: form.kh_name || null,
      nationality: form.nationality || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      basic_salary: form.basic_salary !== "" ? parseFloat(form.basic_salary) : null,
    });
    setRowSaving(false);
    if (ok) setEditing(false);
  };

  const isRegistered = !!emp.nssf_number;

  if (editing) {
    return (
      <tr className="bg-blue-50/30 border-b border-gray-100">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            {emp.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#253C7D]">
                  {emp.first_name[0]}{emp.last_name[0]}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-800">{emp.first_name} {emp.last_name}</p>
              <p className="text-[11px] text-gray-400">{emp.id}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-2">
          <input
            value={form.nssf_number}
            onChange={(e) => setForm((f) => ({ ...f, nssf_number: e.target.value }))}
            placeholder="NSSF Number"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={form.kh_name}
            onChange={(e) => setForm((f) => ({ ...f, kh_name: e.target.value }))}
            placeholder="ឈ្មោះខ្មែរ"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
          >
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </td>
        <td className="px-2 py-2">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2 text-xs text-gray-500">{emp.join_date || "—"}</td>
        <td className="px-2 py-2">
          <input
            type="number"
            step="0.01"
            value={form.basic_salary}
            onChange={(e) => setForm((f) => ({ ...f, basic_salary: e.target.value }))}
            placeholder="0.00"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={rowSaving}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1e3167] transition-colors cursor-pointer disabled:opacity-50"
            >
              {rowSaving ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-check-line" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors group">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#253C7D]">
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-800">{emp.first_name} {emp.last_name}</p>
            <p className="text-[11px] text-gray-400">{emp.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {emp.nssf_number ? (
          <span className="text-xs font-mono text-gray-800">{emp.nssf_number}</span>
        ) : (
          <span className="text-[11px] text-orange-500 font-medium">Not Registered</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-700">{emp.kh_name || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5">
        {emp.gender ? (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${emp.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
            {emp.gender}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-600">{emp.date_of_birth || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5 text-xs text-gray-600">{emp.join_date || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5 text-xs text-gray-800 font-medium">
        {emp.basic_salary != null ? `$${Number(emp.basic_salary).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              isRegistered ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
            }`}
          >
            {isRegistered ? "Registered" : "Pending"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#253C7D]/10 text-[#253C7D] cursor-pointer"
            title="Edit NSSF info"
          >
            <i className="ri-pencil-line text-xs" />
          </button>
        </div>
      </td>
    </tr>
  );
}
