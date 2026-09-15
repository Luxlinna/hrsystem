import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalAchievementSection = memo(function PersonalAchievementSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.achievement_history || [];
    onChange("achievement_history", [
      ...current,
      {
        title: "",
        year_awarded: new Date().getFullYear().toString(),
        country: "Cambodia",
        program_name: "",
        organizer_name: "",
        remark: "",
        attachment: "",
      },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.achievement_history || [])];
    updated.splice(idx, 1);
    onChange("achievement_history", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Archievement Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Archievement"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[850px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-2.5 w-10">No.</th>
              <th className="py-2 px-2.5">Title</th>
              <th className="py-2 px-2.5">Year Awarded</th>
              <th className="py-2 px-2.5">Country</th>
              <th className="py-2 px-2.5">Program Name</th>
              <th className="py-2 px-2.5">Organizer Name</th>
              <th className="py-2 px-2.5">Remark</th>
              <th className="py-2 px-2.5">Attachment</th>
              <th className="py-2 px-2.5 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.achievement_history && form.achievement_history.length > 0 ? (
              form.achievement_history.map((ach, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-2.5 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={ach.title}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="Achievement Title"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="number"
                      value={ach.year_awarded}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], year_awarded: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="YYYY"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={ach.country}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], country: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="Country"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={ach.program_name}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], program_name: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="Program Name"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={ach.organizer_name}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], organizer_name: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="Organizer Name"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="text"
                      value={ach.remark}
                      onChange={(e) => {
                        const updated = [...(form.achievement_history || [])];
                        updated[idx] = { ...updated[idx], remark: e.target.value };
                        onChange("achievement_history", updated);
                      }}
                      placeholder="Remark"
                      className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-2.5">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const updated = [...(form.achievement_history || [])];
                          updated[idx] = { ...updated[idx], attachment: file.name };
                          onChange("achievement_history", updated);
                        }
                      }}
                      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-2.5 text-center">
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
                <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                  Empty Employee Archievements
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Archievement"
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
