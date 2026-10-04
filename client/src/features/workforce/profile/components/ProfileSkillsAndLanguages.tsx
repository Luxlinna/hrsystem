import React from "react";
import { ProfileSkillsField } from "./ProfileSkillsField";
import { ProfileLanguagesField } from "./ProfileLanguagesField";

interface ProfileSkillsAndLanguagesProps {
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  languages: string[];
  setLanguages: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProfileSkillsAndLanguages({
  skills,
  setSkills,
  languages,
  setLanguages,
}: ProfileSkillsAndLanguagesProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
      <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <i className="ri-medal-line text-[#253C7D] text-[15px]"></i>
        <span>Skills & Languages</span>
      </h4>

      <ProfileSkillsField skills={skills} setSkills={setSkills} />
      <ProfileLanguagesField languages={languages} setLanguages={setLanguages} />
    </div>
  );
}
