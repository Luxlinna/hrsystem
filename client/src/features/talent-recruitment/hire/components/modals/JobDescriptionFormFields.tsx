import { memo, useState, useEffect, useMemo } from "react";
import type { NewHiringRequestFormState } from "../../types";
import { JobDescriptionFormHeader } from "./JobDescriptionFormHeader";
import { ModernSearchSelect } from "./ModernSearchSelect";
import { toast } from "@/components/Toast";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
}

interface SkillCategoryItem {
  id: string;
  type: "technical" | "tools" | "soft" | "experience" | "custom";
  label: string;
  value: string;
  placeholder: string;
}

const DEFAULT_RESPONSIBILITIES = [
  "Manage daily workflows and team deliverables",
  "Coordinate cross-branch operations",
  "Monitor performance metrics...",
];

export const JobDescriptionFormFields = memo(function JobDescriptionFormFields({ form, setForm }: Props) {
  const [rightTab, setRightTab] = useState<"skills" | "experience">("skills");
  const [previewOpen, setPreviewOpen] = useState(false);

  // Parse responsibilities into individual items
  const [respItems, setRespItems] = useState<string[]>(() => {
    if (form.jd_responsibilities && form.jd_responsibilities.trim()) {
      const parsed = form.jd_responsibilities
        .split("\n")
        .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
      return parsed.length > 0 ? parsed : DEFAULT_RESPONSIBILITIES;
    }
    return DEFAULT_RESPONSIBILITIES;
  });

  // Sync responsibilities to form state
  const updateResponsibilities = (items: string[]) => {
    setRespItems(items);
    const text = items
      .filter((s) => s.trim().length > 0)
      .map((s) => `• ${s}`)
      .join("\n");
    setForm((prev) => ({ ...prev, jd_responsibilities: text }));
  };

  const handleRespChange = (index: number, val: string) => {
    const next = [...respItems];
    next[index] = val;
    updateResponsibilities(next);
  };

  const handleAddResp = () => {
    const next = [...respItems, ""];
    updateResponsibilities(next);
  };

  const handleRemoveResp = (index: number) => {
    const next = respItems.filter((_, i) => i !== index);
    updateResponsibilities(next.length > 0 ? next : [""]);
  };

  // Categorized Skills state
  const [skillsList, setSkillsList] = useState<SkillCategoryItem[]>(() => {
    return [
      {
        id: "tech",
        type: "technical",
        label: "Technical skills",
        placeholder: "Technical skills (e.g. JavaScript, React, Laravel, etc.)",
        value: "",
      },
      {
        id: "tool",
        type: "tools",
        label: "Tools",
        placeholder: "Tools (e.g. Git, Docker, Jira, etc.)",
        value: "",
      },
      {
        id: "soft",
        type: "soft",
        label: "Soft skills",
        placeholder: "Soft skills (e.g. communication, teamwork, problem-solving, etc.)",
        value: "",
      },
      {
        id: "exp",
        type: "experience",
        label: "Professional experience",
        placeholder: "Professional experience (e.g. 2+ years in relevant field)",
        value: "",
      },
    ];
  });

  // Auto-sync responsibilities when updated externally (upload file / paste / template)
  useEffect(() => {
    if (form.jd_responsibilities && form.jd_responsibilities.trim()) {
      const parsed = form.jd_responsibilities
        .split("\n")
        .map((s) => s.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
      if (parsed.length > 0) {
        setRespItems(parsed);
      }
    }
  }, [form.jd_responsibilities]);

  // Auto-sync skills when updated externally (upload file / paste / template)
  useEffect(() => {
    if (!form.jd_requirements || !form.jd_requirements.trim()) return;
    const lines = form.jd_requirements
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setSkillsList((prev) => {
      const updated = prev.map((item) => ({ ...item }));
      const customItems: SkillCategoryItem[] = [];

      lines.forEach((line) => {
        const lower = line.toLowerCase();
        if (lower.startsWith("technical skills:") || lower.startsWith("technical:")) {
          const val = line.split(/:\s*/)[1] || line;
          const target = updated.find((s) => s.type === "technical");
          if (target) target.value = val;
        } else if (lower.startsWith("tools:") || lower.startsWith("tools")) {
          const val = line.split(/:\s*/)[1] || line;
          const target = updated.find((s) => s.type === "tools");
          if (target) target.value = val;
        } else if (lower.startsWith("soft skills:") || lower.startsWith("soft:")) {
          const val = line.split(/:\s*/)[1] || line;
          const target = updated.find((s) => s.type === "soft");
          if (target) target.value = val;
        } else if (lower.startsWith("professional experience:") || lower.startsWith("experience:")) {
          const val = line.split(/:\s*/)[1] || line;
          const target = updated.find((s) => s.type === "experience");
          if (target) target.value = val;
        } else {
          // Categorize by keywords if slot is empty
          if (/(?:react|javascript|typescript|python|java|php|sql|node|c#|golang|css|html|api|aws|cloud|frontend|backend|fullstack)/i.test(line) && !updated.find((s) => s.type === "technical")?.value) {
            const target = updated.find((s) => s.type === "technical");
            if (target) target.value = line;
          } else if (/(?:git|docker|jira|figma|linux|postman|vscode|trello|slack|excel|word)/i.test(line) && !updated.find((s) => s.type === "tools")?.value) {
            const target = updated.find((s) => s.type === "tools");
            if (target) target.value = line;
          } else if (/(?:communication|teamwork|leadership|problem-solving|critical thinking|agile|collaborat|organized)/i.test(line) && !updated.find((s) => s.type === "soft")?.value) {
            const target = updated.find((s) => s.type === "soft");
            if (target) target.value = line;
          } else if (/(?:\d+\+?\s*years?|experience|track record)/i.test(line) && !updated.find((s) => s.type === "experience")?.value) {
            const target = updated.find((s) => s.type === "experience");
            if (target) target.value = line;
          } else {
            customItems.push({
              id: `req-ext-${Math.random().toString(36).substr(2, 9)}`,
              type: "custom",
              label: "Requirement",
              placeholder: "Specify additional requirement...",
              value: line,
            });
          }
        }
      });

      const baseTypes = ["technical", "tools", "soft", "experience"];
      const baseItems = updated.filter((s) => baseTypes.includes(s.type));
      return [...baseItems, ...customItems];
    });
  }, [form.jd_requirements]);

  // Sync structured skills into form.jd_requirements
  const syncSkillsToForm = (list: SkillCategoryItem[]) => {
    setSkillsList(list);
    const lines = list
      .filter((item) => item.value.trim().length > 0)
      .map((item) => `• ${item.label}: ${item.value.trim()}`);
    setForm((prev) => ({
      ...prev,
      jd_requirements: lines.length > 0 ? lines.join("\n") : prev.jd_requirements,
    }));
  };

  const handleSkillChange = (id: string, val: string) => {
    const next = skillsList.map((item) => (item.id === id ? { ...item, value: val } : item));
    syncSkillsToForm(next);
  };

  const handleClearSkill = (id: string) => {
    const next = skillsList.map((item) => (item.id === id ? { ...item, value: "" } : item));
    syncSkillsToForm(next);
  };

  const handleRemoveSkill = (id: string) => {
    const next = skillsList.filter((item) => item.id !== id);
    syncSkillsToForm(next);
  };

  const handleAddCustomRequirement = () => {
    const newId = `req-${Date.now()}`;
    const next: SkillCategoryItem[] = [
      ...skillsList,
      {
        id: newId,
        type: "custom",
        label: "Requirement",
        placeholder: "Specify additional skill requirement (e.g. Next.js, Redux, PostgreSQL)...",
        value: "",
      },
    ];
    syncSkillsToForm(next);
    toast.success("New skill slot added");
  };

  // Dynamic Custom Experience & Qualifications state
  interface CustomExpItem {
    id: string;
    label: string;
    placeholder: string;
    value: string;
  }
  const [customExpList, setCustomExpList] = useState<CustomExpItem[]>([]);

  const handleAddCustomExp = () => {
    const newId = `exp-${Date.now()}`;
    const next: CustomExpItem[] = [
      ...customExpList,
      {
        id: newId,
        label: "Qualification / Experience",
        placeholder: "e.g. Certifications (PMP, AWS), specific industry license, language fluency...",
        value: "",
      },
    ];
    setCustomExpList(next);
    toast.success("New qualification slot added");
  };

  const handleCustomExpChange = (id: string, val: string) => {
    setCustomExpList((prev) => prev.map((item) => (item.id === id ? { ...item, value: val } : item)));
  };

  const handleRemoveCustomExp = (id: string) => {
    setCustomExpList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddHeaderRequirement = () => {
    if (rightTab === "skills") {
      handleAddCustomRequirement();
    } else {
      handleAddCustomExp();
    }
  };

  const handleHelpWriting = () => {
    const title = form.title || form.position || "this position";
    const dept = form.department || "the department";
    const sampleSummary = `Oversee and execute day-to-day strategic deliverables for ${title} within ${dept}. Drive workflow efficiency, ensure enterprise quality standards, and collaborate across cross-functional teams to achieve organizational goals.`;
    setForm((prev) => ({ ...prev, jd_summary: sampleSummary }));
    toast.success("AI draft generated for Role Overview!");
  };

  return (
    <div className="space-y-3.5">
      {/* Top Header Card */}
      <JobDescriptionFormHeader form={form} setForm={setForm} />

      {/* Main 2-Column Grid matching the Target UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        {/* Left Column: Card 1 (Role Overview) & Card 2 (Key Responsibilities) */}
        <div className="space-y-3.5 flex flex-col">
          {/* Card 1: Role Overview */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    Role Overview
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Describe the position, its purpose, and how it supports the team and business goals.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleHelpWriting}
                className="px-2.5 py-1 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/80 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                title="Generate starter description"
              >
                <i className="ri-lightbulb-line text-amber-500 text-xs" />
                <span>Help writing</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                required
                maxLength={500}
                placeholder="Summarize the core mission and strategic purpose of this position within the department... (e.g. To support business expansion, replace existing role, etc.)"
                value={form.jd_summary || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, jd_summary: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[90px] font-medium leading-relaxed pb-6"
              />
              <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                {(form.jd_summary || "").length}/500
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
              <i className="ri-information-line text-blue-600 text-xs" />
              <span>Be clear and concise about the role's purpose, impact and key objectives.</span>
            </div>
          </div>

          {/* Card 2: Key Responsibilities */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    Key Responsibilities
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    List the main duties and expected outcomes for this role.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddResp}
                className="px-2.5 py-1 rounded-full bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
              >
                <i className="ri-add-line text-xs font-bold" />
                <span>Add responsibility</span>
              </button>
            </div>

            {/* List of Responsibility Rows */}
            <div className="space-y-2">
              {respItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs group"
                >
                  <div className="text-slate-400 text-sm cursor-grab active:cursor-grabbing shrink-0 select-none">
                    <i className="ri-draggable" />
                  </div>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleRespChange(idx, e.target.value)}
                    placeholder={
                      idx === 0
                        ? "e.g. Manage daily workflows and team deliverables"
                        : idx === 1
                        ? "e.g. Coordinate cross-branch operations"
                        : "e.g. Monitor performance metrics..."
                    }
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <i className="ri-delete-bin-line text-xs" />
                  </button>
                </div>
              ))}
            </div>

            {/* Green Tip Container */}
            <div className="p-2.5 bg-emerald-50/60 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center gap-2 border border-emerald-100/80">
              <i className="ri-focus-3-line text-emerald-600 text-sm shrink-0" />
              <span>Focus on what the person will do and the results they will achieve.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Card 3 (Requirements & Skills with Tabs) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Card Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                3
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                  Requirements & Skills
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specify the key qualifications and skills needed for this role.
                </p>
              </div>
            </div>

            {/* Inner Sub-Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold pt-1">
              <button
                type="button"
                onClick={() => setRightTab("skills")}
                className={`pb-2.5 flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  rightTab === "skills"
                    ? "text-purple-700 border-b-2 border-purple-600 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="ri-award-line text-sm text-purple-600" />
                <span>Skills & Qualifications</span>
              </button>

              <button
                type="button"
                onClick={() => setRightTab("experience")}
                className={`pb-2.5 flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  rightTab === "experience"
                    ? "text-purple-700 border-b-2 border-purple-600 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="ri-book-open-line text-sm text-purple-600" />
                <span>Experience & Education</span>
              </button>
            </div>

            {/* Tab 1: Skills & Qualifications */}
            {rightTab === "skills" ? (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                {skillsList.map((skill) => {
                  const getIcon = () => {
                    switch (skill.type) {
                      case "technical":
                        return { icon: "ri-code-s-slash-line", bg: "bg-purple-50 text-purple-600 border-purple-200/80" };
                      case "tools":
                        return { icon: "ri-tools-line", bg: "bg-sky-50 text-sky-600 border-sky-200/80" };
                      case "soft":
                        return { icon: "ri-team-line", bg: "bg-emerald-50 text-emerald-600 border-emerald-200/80" };
                      case "experience":
                        return { icon: "ri-briefcase-line", bg: "bg-indigo-50 text-indigo-600 border-indigo-200/80" };
                      default:
                        return { icon: "ri-star-line", bg: "bg-purple-50 text-purple-600 border-purple-200/80" };
                    }
                  };
                  const ic = getIcon();

                  return (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs group"
                    >
                      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs shrink-0 ${ic.bg}`}>
                        <i className={ic.icon} />
                      </div>
                      <input
                        type="text"
                        value={skill.value}
                        onChange={(e) => handleSkillChange(skill.id, e.target.value)}
                        placeholder={skill.placeholder}
                        className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                      />
                      {skill.type === "custom" ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                          title="Remove requirement"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      ) : skill.value ? (
                        <button
                          type="button"
                          onClick={() => handleClearSkill(skill.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                          title="Clear field"
                        >
                          <i className="ri-close-line text-xs" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddCustomRequirement}
                  className="w-full py-2 border border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
                >
                  <i className="ri-add-line text-xs font-bold" />
                  <span>Add new skill</span>
                </button>
              </div>
            ) : (
              /* Tab 2: Experience & Education matching the icon-pill rows format */
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                {/* 1. Years of Experience */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-7 h-7 rounded-lg border bg-indigo-50 text-indigo-600 border-indigo-200/80 flex items-center justify-center text-xs shrink-0">
                    <i className="ri-time-line" />
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={form.years_of_experience || "2 - 5 years"}
                      onChange={(e) => setForm((prev) => ({ ...prev, years_of_experience: e.target.value }))}
                      className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 font-medium cursor-pointer appearance-none pr-5"
                    >
                      <option value="0 - 1 year">0 - 1 year of experience</option>
                      <option value="1 - 2 years">1 - 2 years of experience</option>
                      <option value="2 - 5 years">2 - 5 years of experience</option>
                      <option value="5 - 8 years">5 - 8 years of experience</option>
                      <option value="8+ years">8+ years of experience</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none text-slate-400 text-xs">
                      <i className="ri-arrow-down-s-line" />
                    </div>
                  </div>
                </div>

                {/* 2. Experience Description */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-7 h-7 rounded-lg border bg-sky-50 text-sky-600 border-sky-200/80 flex items-center justify-center text-xs shrink-0">
                    <i className="ri-briefcase-line" />
                  </div>
                  <input
                    type="text"
                    value={form.experience_description || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, experience_description: e.target.value }))}
                    placeholder="Experience details (e.g. Operations, team leadership, etc.)"
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                  {form.experience_description && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, experience_description: "" }))}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                      title="Clear field"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  )}
                </div>

                {/* 3. Education & Degree */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-7 h-7 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200/80 flex items-center justify-center text-xs shrink-0">
                    <i className="ri-graduation-cap-line" />
                  </div>
                  <input
                    type="text"
                    value={form.jd_qualifications || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, jd_qualifications: e.target.value }))}
                    placeholder="Required education (e.g. Bachelor's in Computer Science, Business, etc.)"
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                  {form.jd_qualifications && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, jd_qualifications: "" }))}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                      title="Clear field"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  )}
                </div>

                {/* 4. Reports To */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-7 h-7 rounded-lg border bg-purple-50 text-purple-600 border-purple-200/80 flex items-center justify-center text-xs shrink-0">
                    <i className="ri-node-tree" />
                  </div>
                  <input
                    type="text"
                    value={form.jd_reporting_line || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, jd_reporting_line: e.target.value }))}
                    placeholder="Reports to (e.g. Operations Director, Head of Engineering)"
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                  {form.jd_reporting_line && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, jd_reporting_line: "" }))}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                      title="Clear field"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  )}
                </div>

                {/* 5. Team / Supervision (Optional) */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="w-7 h-7 rounded-lg border bg-amber-50 text-amber-600 border-amber-200/80 flex items-center justify-center text-xs shrink-0">
                    <i className="ri-team-line" />
                  </div>
                  <input
                    type="text"
                    value={form.team_supervision || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, team_supervision: e.target.value }))}
                    placeholder="Team / Supervision (e.g. 3–5 team members, cross-functional squad)"
                    className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                  {form.team_supervision && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, team_supervision: "" }))}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                      title="Clear field"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  )}
                </div>

                {/* 6. Dynamic Custom Experience & Qualifications */}
                {customExpList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-purple-200/80 bg-purple-50/20 hover:border-purple-300 transition-all shadow-2xs group"
                  >
                    <div className="w-7 h-7 rounded-lg border bg-purple-100/70 text-purple-700 border-purple-200 flex items-center justify-center text-xs shrink-0">
                      <i className="ri-award-line" />
                    </div>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => handleCustomExpChange(item.id, e.target.value)}
                      placeholder={item.placeholder}
                      className="w-full bg-transparent border-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomExp(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors shrink-0"
                      title="Remove qualification"
                    >
                      <i className="ri-delete-bin-line text-xs" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCustomExp}
                  className="w-full py-2 border border-dashed border-purple-300 hover:border-purple-500 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
                >
                  <i className="ri-add-line text-xs font-bold" />
                  <span>Add new qualification / experience</span>
                </button>
              </div>
            )}
          </div>

          {/* Blue Dashed Tip Box matching Image 1 */}
          <div className="p-3 bg-blue-50/40 rounded-xl border border-dashed border-blue-200/90 text-blue-900 mt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <i className="ri-information-line text-sm text-blue-600" />
              <span>Tip</span>
            </div>
            <p className="text-[11px] text-blue-700/90 mt-0.5 leading-relaxed">
              {rightTab === "skills"
                ? "Include technical skills, tools, and soft skills that are essential for success in this role."
                : "Specify relevant years of experience, degree requirements, and organizational reporting hierarchy."}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible: Job Description Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setPreviewOpen(!previewOpen)}
          className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm shrink-0">
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
          </div>
        )}
      </div>
    </div>
  );
});
