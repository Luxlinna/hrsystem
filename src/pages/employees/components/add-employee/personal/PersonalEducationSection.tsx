import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalEducationSection = memo(function PersonalEducationSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.education_history || [];
    onChange("education_history", [
      ...current,
      {
        institue: "",
        subject: "",
        degree: "Bachelor",
        start_date: "",
        end_date: "",
        remark: "",
      },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.education_history || [])];
    updated.splice(idx, 1);
    onChange("education_history", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Education History Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Education History"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Institue</th>
              <th className="py-2 px-3">Subject</th>
              <th className="py-2 px-3">Degree</th>
              <th className="py-2 px-3">Start Date</th>
              <th className="py-2 px-3">End Date</th>
              <th className="py-2 px-3">Remark</th>
              <th className="py-2 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.education_history && form.education_history.length > 0 ? (
              form.education_history.map((edu, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={edu.institue}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], institue: e.target.value };
                        onChange("education_history", updated);
                      }}
                      placeholder="Institute / University"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={edu.subject}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], subject: e.target.value };
                        onChange("education_history", updated);
                      }}
                      placeholder="Subject / Major"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], degree: e.target.value };
                        onChange("education_history", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
                    >
                      <option value="High School">High School</option>
                      <option value="Associate">Associate Degree</option>
                      <option value="Bachelor">Bachelor Degree</option>
                      <option value="Master">Master Degree</option>
                      <option value="Doctorate">Doctorate (PhD)</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={edu.start_date}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], start_date: e.target.value };
                        onChange("education_history", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={edu.end_date}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], end_date: e.target.value };
                        onChange("education_history", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={edu.remark}
                      onChange={(e) => {
                        const updated = [...(form.education_history || [])];
                        updated[idx] = { ...updated[idx], remark: e.target.value };
                        onChange("education_history", updated);
                      }}
                      placeholder="Remark"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
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
                <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                  Empty Education Histories
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Education History"
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
