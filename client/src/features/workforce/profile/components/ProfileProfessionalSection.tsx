import React from "react";
import type { MyEmployee } from "../types";
import { ProfileCandidateBanner } from "./ProfileCandidateBanner";
import { ProfileResumeCard } from "./ProfileResumeCard";
import { ProfileCredentialsForm } from "./ProfileCredentialsForm";
import { ProfileSkillsAndLanguages } from "./ProfileSkillsAndLanguages";
import { ProfileApplicationHistory } from "./ProfileApplicationHistory";

export interface ProfileProfessionalSectionProps {
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
  const candidateId =
    employee?.candidate_code ||
    (employee?.candidate_id
      ? `CAN-2026-${employee.candidate_id.slice(0, 6).toUpperCase()}`
      : "CAN-2026-000001");
  const applications = employee?.applications || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. Hero Candidate Master ID Banner ── */}
      <ProfileCandidateBanner
        employee={employee}
        candidateId={candidateId}
        savingProfessional={savingProfessional}
        onSaveProfessional={onSaveProfessional}
      />

      {/* Onboarding Source Notice */}
      <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-[12px] text-[#253C7D] shadow-2xs">
        <i className="ri-shield-check-line text-[18px] text-blue-600 shrink-0"></i>
        <span>
          <strong>Onboarding Data Pipeline:</strong> All credentials (CV file, Education, Experience, Skills, and Notice Period) are automatically retrieved from the new hire onboarding process.
        </span>
      </div>

      {/* ── 2. AWS S3 CV & Resume Management ── */}
      <ProfileResumeCard
        resumeUrl={resumeUrl}
        resumeName={resumeName}
        uploadingResume={uploadingResume}
        onResumeUpload={onResumeUpload}
        onRemoveResume={onRemoveResume}
      />

      {/* ── 3. Availability, Location, Compensation, Education & Experience ── */}
      <ProfileCredentialsForm
        location={location}
        setLocation={setLocation}
        noticePeriod={noticePeriod}
        setNoticePeriod={setNoticePeriod}
        expectedSalary={expectedSalary}
        setExpectedSalary={setExpectedSalary}
        education={education}
        setEducation={setEducation}
        workExperience={workExperience}
        setWorkExperience={setWorkExperience}
      />

      {/* ── 4. Skills & Languages Tag Editor ── */}
      <ProfileSkillsAndLanguages
        skills={skills}
        setSkills={setSkills}
        languages={languages}
        setLanguages={setLanguages}
      />

      {/* ── 5. Application & Hiring Outcomes History ── */}
      <ProfileApplicationHistory applications={applications} />
    </div>
  );
}
