import { memo, useState } from "react";
import type { NewHiringRequestFormState } from "../../types";
import { JobDescriptionFormHeader } from "./JobDescriptionFormHeader";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
}

export const JobDescriptionFormFields = memo(function JobDescriptionFormFields({ form, setForm }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const addBullet = (field: "jd_responsibilities" | "jd_requirements" | "jd_qualifications") => {
    const cur = form[field] || "";
    const prefix = cur.length > 0 && !cur.endsWith("\n") ? "\n• " : "• ";
    setForm({ ...form, [field]: cur + prefix });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <JobDescriptionFormHeader form={form} setForm={setForm} />

      {/* Main Grid: Left Column (Role Overview + Key Responsibilities) & Right Column (Requirements & Skills) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
        {/* Left Column */}
        <div className="space-y-3.5 flex flex-col justify-between">
          {/* Card: Role Overview */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <i className="ri-file-text-line text-blue-600" />
              <span>Role Overview</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Purpose & Mission *</label>
              <div className="relative">
                <textarea
                  rows={3}
                  required
                  maxLength={500}
                  placeholder="Summarize the core mission and strategic purpose of this position within the department...&#10;(e.g. To support business expansion, replace existing role, etc.)"
                  value={form.jd_summary || ""}
                  onChange={(e) => setForm({ ...form, jd_summary: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[75px] font-medium leading-relaxed pb-5"
                />
                <div className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-400 font-mono">
                  {(form.jd_summary || "").length}/500
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Be clear and concise about the role's purpose, impact and key objectives.
              </p>
            </div>
          </div>

          {/* Card: Key Responsibilities */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <i className="ri-file-list-3-line text-blue-600" />
                <span>Key Responsibilities</span>
              </div>
              <button
                type="button"
                onClick={() => addBullet("jd_responsibilities")}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold border border-blue-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-add-line" /> Add responsibility
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Main Responsibilities *</label>
              <div className="relative">
                <textarea
                  rows={4}
                  required
                  maxLength={500}
                  placeholder="• Manage daily workflows and team deliverables&#10;• Coordinate cross-branch operations&#10;• Monitor performance metrics..."
                  value={form.jd_responsibilities || ""}
                  onChange={(e) => setForm({ ...form, jd_responsibilities: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[85px] font-medium leading-relaxed pb-5"
                />
                <div className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-400 font-mono">
                  {(form.jd_responsibilities || "").length}/500
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                List the main duties and expected outcomes for this role.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Requirements & Skills */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <i className="ri-file-list-line text-blue-600" />
                <span>Requirements & Skills</span>
              </div>
              <button
                type="button"
                onClick={() => addBullet("jd_requirements")}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold border border-blue-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-add-line" /> Add requirement
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Key Requirements & Skills *</label>
              <div className="relative">
                <textarea
                  rows={9}
                  required
                  maxLength={500}
                  placeholder="• 2+ years of relevant industry experience&#10;• Strong analytical and problem-solving skills&#10;• Proficiency in required systems..."
                  value={form.jd_requirements || ""}
                  onChange={(e) => setForm({ ...form, jd_requirements: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[195px] font-medium leading-relaxed pb-5"
                />
                <div className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-400 font-mono">
                  {(form.jd_requirements || "").length}/500
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Include technical skills, tools, and soft skills.
          </p>
        </div>
      </div>

      {/* Full Width Card: Education & Qualifications */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <i className="ri-graduation-cap-line text-blue-600" />
          <span>Education & Qualifications</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Required Education & Qualifications *</label>
          <div className="relative">
            <textarea
              rows={3}
              maxLength={500}
              placeholder="• Bachelor's Degree in related discipline&#10;• Professional certifications (PMP, CPA, etc.)..."
              value={form.jd_qualifications || ""}
              onChange={(e) => setForm({ ...form, jd_qualifications: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[65px] font-medium leading-relaxed pb-5"
            />
            <div className="absolute bottom-1.5 right-2.5 text-[9px] text-slate-400 font-mono">
              {(form.jd_qualifications || "").length}/500
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Include degree level, field of study, and any required certifications.
          </p>
        </div>
      </div>

      {/* Experience & Reporting Line Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Left: Experience */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1.5">
              <i className="ri-briefcase-line text-blue-600" />
              <span>Experience</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience *</label>
                <div className="relative">
                  <select
                    value={form.years_of_experience || "2 - 5 years"}
                    onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="0 - 1 year">0 - 1 year</option>
                    <option value="1 - 2 years">1 - 2 years</option>
                    <option value="2 - 5 years">2 - 5 years</option>
                    <option value="5 - 8 years">5 - 8 years</option>
                    <option value="8+ years">8+ years</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                    <i className="ri-arrow-down-s-line" />
                  </div>
                </div>
              </div>
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Description *</label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Relevant experience in operations, team leadership, and process improvement..."
                    value={form.experience_description || ""}
                    onChange={(e) => setForm({ ...form, experience_description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[50px] font-medium pb-4"
                  />
                  <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono">
                    {(form.experience_description || "").length}/500
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Specify the required years and key experience details.
          </p>
        </div>

        {/* Right: Reporting Line */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
            <i className="ri-node-tree text-blue-600" />
            <span>Reporting Line</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reports To *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="ri-search-line" />
                </div>
                <input
                  type="text"
                  placeholder="Select position or manager"
                  value={form.jd_reporting_line || ""}
                  onChange={(e) => setForm({ ...form, jd_reporting_line: e.target.value })}
                  className="w-full pl-8 pr-8 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="ri-arrow-down-s-line" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Team / Supervision (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={200}
                  placeholder="e.g. 3–5 team members, cross-functional team"
                  value={form.team_supervision || ""}
                  onChange={(e) => setForm({ ...form, team_supervision: e.target.value })}
                  className="w-full px-3 pr-12 py-2 bg-slate-50/60 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[9px] text-slate-400 font-mono">
                  {(form.team_supervision || "").length}/200
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible: Job Description Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setPreviewOpen(!previewOpen)}
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm shrink-0">
              <i className="ri-eye-line" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Job Description Preview</p>
              <p className="text-[11px] text-slate-500">
                A summary of the information you've entered will be used in the requisition and published to candidates.
              </p>
            </div>
          </div>
          <i
            className={`ri-arrow-down-s-line text-slate-400 text-base transition-transform duration-200 ${
              previewOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {previewOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 text-xs text-slate-700">
            {form.jd_summary && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Role Purpose & Mission:</p>
                <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {form.jd_summary}
                </p>
              </div>
            )}
            {form.jd_responsibilities && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Key Responsibilities:</p>
                <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {form.jd_responsibilities}
                </p>
              </div>
            )}
            {form.jd_requirements && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Core Requirements & Skills:</p>
                <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {form.jd_requirements}
                </p>
              </div>
            )}
            {form.jd_qualifications && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Education & Qualifications:</p>
                <p className="whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {form.jd_qualifications}
                </p>
              </div>
            )}
            {(form.years_of_experience || form.experience_description) && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Experience:</p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <p><span className="font-semibold">Required Years:</span> {form.years_of_experience || "2 - 5 years"}</p>
                  {form.experience_description && <p>{form.experience_description}</p>}
                </div>
              </div>
            )}
            {(form.jd_reporting_line || form.team_supervision) && (
              <div>
                <p className="font-bold text-slate-900 mb-1">Reporting Line & Structure:</p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  {form.jd_reporting_line && <p><span className="font-semibold">Reports To:</span> {form.jd_reporting_line}</p>}
                  {form.team_supervision && <p><span className="font-semibold">Team / Supervision:</span> {form.team_supervision}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
