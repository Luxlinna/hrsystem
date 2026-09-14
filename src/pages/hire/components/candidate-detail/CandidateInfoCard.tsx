import { memo } from "react";
import type { Candidate } from "../../types";
import { CandidateMasterSummary } from "./CandidateMasterSummary";
import { CandidateCredentialsSection } from "./CandidateCredentialsSection";
import { CandidateCompetenciesSection } from "./CandidateCompetenciesSection";

interface CandidateInfoCardProps {
  candidate: Candidate;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesText: string;
  setNotesText: (text: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

/**
 * Master Profile Card for Candidate Detail View.
 * Displays personal details, verified education & work history, competencies, and recruiter notes.
 * Modularized to keep each component strictly focused and under the ~200 line standard.
 */
export const CandidateInfoCard = memo(function CandidateInfoCard({
  candidate,
  isEditingNotes,
  setIsEditingNotes,
  notesText,
  setNotesText,
  savingNotes,
  onSaveNotes,
}: CandidateInfoCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-7">
      {/* Section 1: Master Candidate Profile Details */}
      <CandidateMasterSummary candidate={candidate} />

      {/* Section 2: Executive Timeline for Education & Work Experience */}
      <CandidateCredentialsSection candidate={candidate} />

      {/* Section 3 & 4: Skills, Languages, Tags & Recruiter Evaluation Notes */}
      <CandidateCompetenciesSection
        candidate={candidate}
        isEditingNotes={isEditingNotes}
        setIsEditingNotes={setIsEditingNotes}
        notesText={notesText}
        setNotesText={setNotesText}
        savingNotes={savingNotes}
        onSaveNotes={onSaveNotes}
      />
    </div>
  );
});
