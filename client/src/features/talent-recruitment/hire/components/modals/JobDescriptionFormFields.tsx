import { memo } from "react";
import type { NewHiringRequestFormState } from "../../types";
import { JobDescriptionFormHeader } from "./JobDescriptionFormHeader";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
}

export const JobDescriptionFormFields = memo(function JobDescriptionFormFields({ form, setForm }: Props) {
  const addBullet = (field: "jd_responsibilities" | "jd_requirements" | "jd_qualifications") => {
    const cur = form[field] || "";
    const prefix = cur.length > 0 && !cur.endsWith("\n") ? "\n• " : "• ";
    setForm({ ...form, [field]: cur + prefix });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <JobDescriptionFormHeader form={form} setForm={setForm} />

      {/* Structured Content Cards */}
      <div className="p-4 sm:p-5 space-y-4 bg-slate-50/60">
        {/* Section 1: Job Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i className="ri-compass-3-line text-indigo-600 text-sm" /> 1. Role Purpose & Mission *
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Why this role is required</span>
          </div>
          <textarea
            rows={3}
            required
            placeholder="Summarize the core mission and strategic purpose of this position within the department..."
            value={form.jd_summary || ""}
            onChange={(e) => setForm({ ...form, jd_summary: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y min-h-[90px] font-medium leading-relaxed"
          />
        </div>

        {/* Section 2 & 3: Responsibilities & Requirements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100/90 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <i className="ri-task-line text-emerald-600 text-sm" /> 2. Key Responsibilities & Duties
              </label>
              <button
                type="button"
                onClick={() => addBullet("jd_responsibilities")}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
              >
                + Bullet
              </button>
            </div>
            <textarea
              rows={7}
              placeholder="• Manage daily workflows and team deliverables&#10;• Coordinate cross-branch operations&#10;• Monitor performance metrics..."
              value={form.jd_responsibilities || ""}
              onChange={(e) => setForm({ ...form, jd_responsibilities: e.target.value })}
              className="w-full flex-1 px-4 py-3 bg-slate-50/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-y min-h-[160px] font-medium leading-relaxed"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100/90 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <i className="ri-checkbox-circle-line text-amber-600 text-sm" /> 3. Core Requirements & Skills
              </label>
              <button
                type="button"
                onClick={() => addBullet("jd_requirements")}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                + Bullet
              </button>
            </div>
            <textarea
              rows={7}
              placeholder="• 2+ years of relevant industry experience&#10;• Strong analytical and problem-solving skills&#10;• Proficiency in required systems..."
              value={form.jd_requirements || ""}
              onChange={(e) => setForm({ ...form, jd_requirements: e.target.value })}
              className="w-full flex-1 px-4 py-3 bg-slate-50/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-y min-h-[160px] font-medium leading-relaxed"
            />
          </div>
        </div>

        {/* Section 4 & 5: Qualifications & Reporting Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-100/90 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <i className="ri-graduation-cap-line text-sky-600 text-sm" /> 4. Education & Qualifications
              </label>
              <button
                type="button"
                onClick={() => addBullet("jd_qualifications")}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors cursor-pointer"
              >
                + Bullet
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="• Bachelor's Degree in related discipline&#10;• Professional certifications (PMP, CPA, etc.)..."
              value={form.jd_qualifications || ""}
              onChange={(e) => setForm({ ...form, jd_qualifications: e.target.value })}
              className="w-full flex-1 px-4 py-3 bg-slate-50/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all resize-y min-h-[110px] font-medium leading-relaxed"
            />
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="ri-git-merge-line text-purple-600 text-sm" /> 5. Reporting Line & Supervision
                </label>
                <span className="text-[10px] text-purple-600 font-semibold">Hierarchy</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Reports to: Operations Director / Supervised by: IT Head"
                value={form.jd_reporting_line || ""}
                onChange={(e) => setForm({ ...form, jd_reporting_line: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-medium leading-relaxed"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-normal">
              Provides governance clarity for Branch CEO, HR Director, and Chairwoman during stage sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
