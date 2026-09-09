import React, { useState, useRef } from "react";
import type { MyEmployee } from "../types";
import { NOTICE_PERIOD_OPTIONS } from "@/pages/hire/constants";
import { toast } from "@/components/Toast";

interface ProfileProfessionalSectionProps {
  employee: MyEmployee | null;
  location: string;
  setLocation: (val: string) => void;
  education: string;
  setEducation: (val: string) => void;
  workExperience: string;
  setWorkExperience: (val: string) => void;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
  languages: string[];
  setLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  expectedSalary: string;
  setExpectedSalary: (val: string) => void;
  noticePeriod: string;
  setNoticePeriod: (val: string) => void;
  resumeUrl: string | null;
  resumeName: string | null;
  savingProfessional: boolean;
  uploadingResume: boolean;
  onSaveProfessional: () => void;
  onResumeUpload: (file: File) => void;
  onRemoveResume: () => void;
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

const COMMON_LANG_SUGGESTIONS = [
  "English (Fluent)",
  "Khmer (Native)",
  "Chinese (Mandarin)",
  "French",
  "Vietnamese",
  "Thai",
];

export function ProfileProfessionalSection({
  employee,
  location,
  setLocation,
  education,
  setEducation,
  workExperience,
  setWorkExperience,
  skills,
  setSkills,
  languages,
  setLanguages,
  expectedSalary,
  setExpectedSalary,
  noticePeriod,
  setNoticePeriod,
  resumeUrl,
  resumeName,
  savingProfessional,
  uploadingResume,
  onSaveProfessional,
  onResumeUpload,
  onRemoveResume,
}: ProfileProfessionalSectionProps) {
  const [skillInput, setSkillInput] = useState("");
  const [langInput, setLangInput] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const candidateId =
    employee?.candidate_code ||
    (employee?.candidate_id
      ? `CAN-2026-${employee.candidate_id.slice(0, 6).toUpperCase()}`
      : "CAN-2026-000001");
  const applications = employee?.applications || [];

  const handleCopyId = () => {
    if (!candidateId) return;
    navigator.clipboard.writeText(candidateId);
    setCopiedId(true);
    toast("Copied!", `Candidate ID ${candidateId} copied to clipboard`, "info");
    setTimeout(() => setCopiedId(false), 2000);
  };

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

  const handleAddLanguage = (text?: string) => {
    const val = (text || langInput).trim().replace(/,/g, "");
    if (val && !languages.includes(val)) {
      setLanguages([...languages, val]);
      if (!text) setLangInput("");
    }
  };

  const handleKeyDownLanguage = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setLanguages(languages.filter((l) => l !== langToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onResumeUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getSourceIcon = (source?: string | null) => {
    if (!source) return "ri-user-shared-line";
    const s = source.toLowerCase();
    if (s.includes("telegram")) return "ri-telegram-fill text-sky-500";
    if (s.includes("linkedin")) return "ri-linkedin-box-fill text-blue-600";
    if (s.includes("walk")) return "ri-walk-line text-emerald-600";
    if (s.includes("referral")) return "ri-team-line text-amber-600";
    return "ri-global-line text-indigo-500";
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. Hero Candidate Master ID Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#162343] to-[#253C7D] p-6 sm:p-7 text-white shadow-md border border-slate-700/40">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner shrink-0">
              <i className="ri-shield-user-fill text-2xl text-blue-300"></i>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  Candidate Master Profile
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Retrieved from Onboarding
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-wider text-white">
                  {candidateId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg text-[11px] font-semibold text-blue-100 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Copy Candidate ID"
                >
                  <i className={copiedId ? "ri-check-line text-emerald-300" : "ri-file-copy-line"}></i>
                  <span>{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
              </div>

              <p className="text-[12px] text-blue-100/80 mt-1">
                Transferred automatically from your candidate recruitment & new hire onboarding process.
              </p>
            </div>
          </div>

          {/* Quick Save Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onSaveProfessional}
              disabled={savingProfessional}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#253C7D] hover:bg-blue-50 font-bold text-[13px] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {savingProfessional ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-[15px]"></i>
                  Saving Changes...
                </>
              ) : (
                <>
                  <i className="ri-save-3-line text-[15px]"></i>
                  Save Profile Info
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recruiter & Logistics Metadata Pill Bar */}
        {(employee?.source || employee?.assigned_recruiter_name || (employee?.tags && employee.tags.length > 0)) && (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[12px]">
            {employee?.source && (
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                <i className={`${getSourceIcon(employee.source)} text-[14px]`}></i>
                <span className="text-white/60">Source:</span>
                <span className="font-semibold text-white">{employee.source}</span>
              </div>
            )}
            {employee?.assigned_recruiter_name && (
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1 rounded-lg border border-white/10">
                <i className="ri-user-voice-line text-blue-300 text-[14px]"></i>
                <span className="text-white/60">Recruiter:</span>
                <span className="font-semibold text-white">{employee.assigned_recruiter_name}</span>
              </div>
            )}
            {employee?.tags && employee.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <i className="ri-price-tag-3-line text-indigo-300 text-[13px]"></i>
                <div className="flex flex-wrap gap-1.5">
                  {employee.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="bg-white/15 text-white text-[11px] px-2.5 py-0.5 rounded-full font-medium border border-white/10"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onboarding Source Notice */}
      <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-[12px] text-[#253C7D] shadow-2xs">
        <i className="ri-shield-check-line text-[18px] text-blue-600 shrink-0"></i>
        <span>
          <strong>Onboarding Data Pipeline:</strong> All credentials (CV file, Education, Experience, Skills, and Notice Period) are automatically retrieved from the new hire onboarding process.
        </span>
      </div>

      {/* ── 2. AWS S3 CV & Resume Management ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <i className="ri-file-pdf-fill text-lg"></i>
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-gray-900">Curriculum Vitae (CV) / Resume</h4>
              <p className="text-[12px] text-gray-500">Stored securely on AWS S3 & accessible to hiring panels.</p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        {resumeUrl ? (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <i className="ri-file-pdf-2-fill text-2xl"></i>
              </div>
              <div className="truncate">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-bold text-gray-900 hover:text-[#253C7D] hover:underline truncate block"
                >
                  {resumeName || "Master_Resume.pdf"}
                </a>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <i className="ri-checkbox-circle-fill text-[12px]"></i> AWS S3 Verified
                  </span>
                  <span>&middot;</span>
                  <span>PDF Document</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#253C7D] text-white hover:bg-[#1E3064] text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <i className="ri-eye-line"></i> View / Download
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingResume}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <i className="ri-upload-2-line"></i> Replace
              </button>
              <button
                type="button"
                onClick={onRemoveResume}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-[14px] cursor-pointer"
                title="Remove CV"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 border-2 border-dashed border-gray-300 hover:border-[#253C7D] rounded-2xl bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#253C7D] group-hover:scale-110 transition-transform flex items-center justify-center mx-auto mb-3">
              {uploadingResume ? (
                <i className="ri-loader-4-line animate-spin text-2xl"></i>
              ) : (
                <i className="ri-upload-cloud-2-line text-2xl"></i>
              )}
            </div>
            <h5 className="text-[13px] font-bold text-gray-800">
              {uploadingResume ? "Uploading CV to AWS S3..." : "Click or drag to upload your CV"}
            </h5>
            <p className="text-[11px] text-gray-400 mt-1">
              Supports PDF, DOC, DOCX up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* ── 3. Availability, Location & Compensation ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-compass-3-line text-[#253C7D] text-[15px]"></i>
          <span>Location & Availability</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Current Location / City
            </label>
            <div className="flex items-center gap-2">
              <i className="ri-map-pin-2-line text-gray-400 text-[15px]"></i>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Phnom Penh, Cambodia"
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Notice Period */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Notice Period / Availability
            </label>
            <div className="flex items-center gap-2">
              <i className="ri-calendar-check-line text-gray-400 text-[15px]"></i>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none cursor-pointer"
              >
                {NOTICE_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Salary */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Expected Salary (USD / mo)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold text-[14px]">$</span>
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. 1500"
                min="0"
                step="50"
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Professional Background (Education & Experience) ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-briefcase-line text-[#253C7D] text-[15px]"></i>
          <span>Education & Experience Credentials</span>
        </h4>

        {/* Education Background */}
        <div>
          <label className="text-[12px] font-bold text-gray-700 flex items-center gap-2 mb-2">
            <i className="ri-graduation-cap-line text-blue-600"></i>
            <span>Education Background</span>
          </label>
          <textarea
            rows={3}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. Bachelor of Science in Computer Science & Information Technology, Royal University of Phnom Penh (2018 - 2022)"
            className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all resize-y"
          />
        </div>

        {/* Work Experience */}
        <div>
          <label className="text-[12px] font-bold text-gray-700 flex items-center gap-2 mb-2">
            <i className="ri-history-line text-indigo-600"></i>
            <span>Work Experience Summary</span>
          </label>
          <textarea
            rows={4}
            value={workExperience}
            onChange={(e) => setWorkExperience(e.target.value)}
            placeholder="e.g. 4+ years in software engineering and cloud infrastructure. Led team of 5 engineers delivering high-availability microservices and real-time HR automation platforms."
            className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all resize-y"
          />
        </div>
      </div>

      {/* ── 5. Skills & Languages Tag Editor ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-medal-line text-[#253C7D] text-[15px]"></i>
          <span>Skills & Languages</span>
        </h4>

        {/* Core Skills */}
        <div>
          <label className="text-[12px] font-bold text-gray-700 block mb-2">
            Core Competencies & Skills
          </label>

          {/* Active Skill Chips */}
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

          {/* Add skill input */}
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

          {/* Suggestions */}
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

        {/* Languages */}
        <div className="pt-5 border-t border-gray-100">
          <label className="text-[12px] font-bold text-gray-700 block mb-2">
            Languages Spoken & Fluency
          </label>

          {/* Active Language Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs transition-all hover:bg-emerald-100"
              >
                <i className="ri-translate-2 text-[12px]"></i>
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(lang)}
                  className="hover:text-rose-600 transition-colors cursor-pointer text-[13px]"
                >
                  <i className="ri-close-line"></i>
                </button>
              </span>
            ))}
            {languages.length === 0 && (
              <span className="text-[12px] text-gray-400 italic py-1">
                No languages added yet.
              </span>
            )}
          </div>

          {/* Add language input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              onKeyDown={handleKeyDownLanguage}
              placeholder="e.g. English (Fluent), Khmer (Native)..."
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => handleAddLanguage()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-[12px] cursor-pointer transition-colors"
            >
              + Add
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 font-medium mr-1">Quick Add:</span>
            {COMMON_LANG_SUGGESTIONS.filter((l) => !languages.includes(l)).slice(0, 4).map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => handleAddLanguage(suggested)}
                className="px-2 py-0.5 rounded-lg bg-gray-100/80 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-gray-600 text-[11px] border border-gray-200/60 transition-colors cursor-pointer"
              >
                + {suggested}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Application & Hiring Outcomes History ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <i className="ri-history-line text-[16px]"></i>
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-gray-900">
                Application & Outcome History
              </h4>
              <p className="text-[12px] text-gray-500">
                {applications.length > 0
                  ? `${applications.length} recorded application${applications.length > 1 ? "s" : ""} across hiring pipelines`
                  : "All historical job submissions linked to your candidate ID"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#253C7D] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {applications.length} Record{applications.length !== 1 ? "s" : ""}
            </span>
            <i
              className={`ri-arrow-down-s-line text-lg text-gray-400 transition-transform ${
                showHistory ? "rotate-180" : ""
              }`}
            ></i>
          </div>
        </div>

        {showHistory && (
          <div className="pt-3 space-y-3">
            {applications.length > 0 ? (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-gray-50/80 hover:bg-slate-50 border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-gray-900">
                        {app.job_posting?.title || "Direct Candidate Submission"}
                      </span>
                      {app.job_posting?.department && (
                        <span className="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          {app.job_posting.department}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>
                        Applied:{" "}
                        <strong className="text-gray-600">
                          {new Date(app.applied_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                      {app.source && (
                        <>
                          <span>&middot;</span>
                          <span>Via {app.source}</span>
                        </>
                      )}
                    </div>

                    {app.notes && (
                      <p className="text-[12px] text-gray-600 italic bg-white/70 p-2 rounded-xl border border-gray-200/50 mt-1">
                        "{app.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {app.stage}
                    </span>
                    {app.outcome && (
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          app.outcome === "hired"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : app.outcome === "rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-slate-200 text-slate-700 border border-slate-300"
                        }`}
                      >
                        {app.outcome.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                <i className="ri-inbox-line text-2xl text-gray-300 mb-1 block"></i>
                <p className="text-[12px] font-medium text-gray-500">
                  No previous recruitment applications linked yet.
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  When you apply or get considered for vacancies, records will automatically appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
