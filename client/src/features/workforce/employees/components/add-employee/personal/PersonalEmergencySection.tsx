import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalEmergencySection = memo(function PersonalEmergencySection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.emergency_contacts || [];
    onChange("emergency_contacts", [
      ...current,
      { contact_person: "", relationship: "Father", phone_number: "" },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.emergency_contacts || [])];
    updated.splice(idx, 1);
    onChange("emergency_contacts", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Emergency Contacts
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Emergency Contact"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[500px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Contact Person</th>
              <th className="py-2 px-3">Relationship</th>
              <th className="py-2 px-3">Phone Number</th>
              <th className="py-2 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.emergency_contacts && form.emergency_contacts.length > 0 ? (
              form.emergency_contacts.map((contact, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={contact.contact_person}
                      onChange={(e) => {
                        const updated = [...(form.emergency_contacts || [])];
                        updated[idx] = { ...updated[idx], contact_person: e.target.value };
                        onChange("emergency_contacts", updated);
                        if (idx === 0) {
                          onChange("emergency_contact_name", e.target.value);
                        }
                      }}
                      placeholder="Contact person name"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={contact.relationship}
                      onChange={(e) => {
                        const updated = [...(form.emergency_contacts || [])];
                        updated[idx] = { ...updated[idx], relationship: e.target.value };
                        onChange("emergency_contacts", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={contact.phone_number}
                      onChange={(e) => {
                        const updated = [...(form.emergency_contacts || [])];
                        updated[idx] = { ...updated[idx], phone_number: e.target.value };
                        onChange("emergency_contacts", updated);
                        if (idx === 0) {
                          onChange("emergency_phone_number", e.target.value);
                        }
                      }}
                      placeholder="e.g. 091 234 567"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D]"
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
                <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                  Empty Emergency Contacts
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Emergency Contact"
                  >
                    <i className="ri-add-line" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
