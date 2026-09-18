import { memo } from "react";
import type { Candidate } from "../../types";

interface CandidateCompetenciesSectionProps {
  candidate: Candidate;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesText: string;
  setNotesText: (text: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

export const CandidateCompetenciesSection = memo(function CandidateCompetenciesSection({
  candidate,
  isEditingNotes,
  setIsEditingNotes,
  notesText,
  setNotesText,
  savingNotes,
  onSaveNotes,
}: CandidateCompetenciesSectionProps) {
  const skillsList = Array.isArray(candidate.skills) ? candidate.skills : [];
  const languagesList = Array.isArray(candidate.languages) ? candidate.languages : [];
  const tagsList = Array.isArray(candidate.tags) ? candidate.tags : [];

  return (
    <>
      {/* Section 3: Skills, Languages & Tags */}
      {(skillsList.length > 0 || languagesList.length > 0 || tagsList.length > 0) && (
        <div className="pt-5 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Core Competencies, Languages & Tags
            </h3>
          </div>

          <div className="space-y-3">
            {skillsList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Skills:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl bg-indigo-50/80 text-indigo-800 font-bold text-xs border border-indigo-200/60 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languagesList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Languages:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {languagesList.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 rounded-xl bg-emerald-50/80 text-emerald-800 font-bold text-xs border border-emerald-200/60 shadow-2xs"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tagsList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Tags:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 4: Recruiter Evaluation Notes */}
      <div className="pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#253C7D]" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Recruiter Evaluation & Screening Notes
            </h3>
          </div>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-extrabold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="ri-edit-line" /> Edit Notes
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Candidate background, salary expectations, recruiter impressions..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingNotes}
                onClick={onSaveNotes}
                className="px-4 py-1.5 text-xs font-bold bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/80 rounded-2xl border-l-4 border-[#253C7D] border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {candidate.notes ? (
              candidate.notes
            ) : (
              <span className="text-slate-400 italic">
                No recruiter notes added yet. Click &ldquo;Edit Notes&rdquo; to add screening thoughts or impressions.
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
});
