import React, { useState } from "react";

interface ProfileSkillsFieldProps {
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
}

const COMMON_SKILL_SUGGESTIONS = [
  "Leadership",
  "Management",
  "Communication",
  "React",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "HR Operations",
  "Talent Acquisition",
  "Project Management",
];

export function ProfileSkillsField({ skills, setSkills }: ProfileSkillsFieldProps) {
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (text?: string) => {
    const val = (text || skillInput).trim().replace(/,/g, "");
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
      if (!text) setSkillInput("");
    }
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div>
      <label className="text-[12px] font-bold text-gray-700 block mb-2">
        Core Competencies & Skills
      </label>

      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-blue-50/80 text-[#253C7D] border border-blue-200/70 shadow-2xs transition-all hover:bg-blue-100"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => handleRemoveSkill(skill)}
              className="hover:text-rose-600 transition-colors cursor-pointer text-[13px]"
            >
              <i className="ri-close-line"></i>
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-[12px] text-gray-400 italic py-1">
            No skills added yet. Type below or select from suggestions.
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={handleKeyDownSkill}
          placeholder="Add skill (press Enter)..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white"
        />
        <button
          type="button"
          onClick={() => handleAddSkill()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-[12px] cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-gray-400 font-medium mr-1">Quick Add:</span>
        {COMMON_SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 6).map((suggested) => (
          <button
            key={suggested}
            type="button"
            onClick={() => handleAddSkill(suggested)}
            className="px-2 py-0.5 rounded-lg bg-gray-100/80 hover:bg-blue-50 hover:text-[#253C7D] hover:border-blue-200 text-gray-600 text-[11px] border border-gray-200/60 transition-colors cursor-pointer"
          >
            + {suggested}
          </button>
        ))}
      </div>
    </div>
  );
}
