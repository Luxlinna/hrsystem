import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalIdentificationSection = memo(function PersonalIdentificationSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.identifications || [];
    onChange("identifications", [
      ...current,
      {
        identification_type: "National ID Card",
        identification_number: "",
        expiration_date: "",
      },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.identifications || [])];
    updated.splice(idx, 1);
    onChange("identifications", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Identification Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Identification"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Identification Type</th>
              <th className="py-2 px-3">Identification Number</th>
              <th className="py-2 px-3">Expiration Date</th>
              <th className="py-2 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.identifications && form.identifications.length > 0 ? (
              form.identifications.map((idItem, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <select
                      value={idItem.identification_type}
                      onChange={(e) => {
                        const updated = [...(form.identifications || [])];
                        updated[idx] = { ...updated[idx], identification_type: e.target.value };
                        onChange("identifications", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
                    >
                      <option value="National ID Card">National ID Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="Work Permit">Work Permit</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={idItem.identification_number}
                      onChange={(e) => {
                        const updated = [...(form.identifications || [])];
                        updated[idx] = { ...updated[idx], identification_number: e.target.value };
                        onChange("identifications", updated);
                        if (idx === 0) {
                          onChange("national_id_number", e.target.value);
                        }
                      }}
                      placeholder="e.g. 010123456"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={idItem.expiration_date}
                      onChange={(e) => {
                        const updated = [...(form.identifications || [])];
                        updated[idx] = { ...updated[idx], expiration_date: e.target.value };
                        onChange("identifications", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                  Empty Identifications
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
