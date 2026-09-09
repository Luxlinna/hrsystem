import { memo } from "react";
import type { Candidate } from "../../types";

interface CandidateInfoCardProps {
  candidate: Candidate;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesText: string;
  setNotesText: (text: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

export const CandidateInfoCard = memo(function CandidateInfoCard({
  candidate,
  isEditingNotes,
  setIsEditingNotes,
  notesText,
  setNotesText,
  savingNotes,
  onSaveNotes,
}: CandidateInfoCardProps) {
  const skillsList = Array.isArray(candidate.skills) ? candidate.skills : [];
  const languagesList = Array.isArray(candidate.languages) ? candidate.languages : [];
  const tagsList = Array.isArray(candidate.tags) ? candidate.tags : [];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
      {/* Section 1: Master Candidate Profile Info */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-id-card-line text-[#253C7D]" />
            <span>Master Profile Details</span>
          </h3>
          {candidate.candidate_code && (
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {candidate.candidate_code}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Email Address
            </span>
            <p className="text-xs font-bold text-gray-900 mt-0.5 select-all truncate">{candidate.email}</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Phone Number
            </span>
            <p className="text-xs font-bold text-gray-900 mt-0.5 select-all">
              {candidate.phone || "Not provided"}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Location / City
            </span>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {candidate.location || "Not specified"}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Expected Salary
            </span>
            <p className="text-xs font-bold text-emerald-700 mt-0.5">
              {candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} / mo` : "Negotiable"}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Notice Period
            </span>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {candidate.notice_period || "Standard (1 Month)"}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Sourcing Channel
            </span>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{candidate.source || "Website"}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Education & Work Experience */}
      {(candidate.education || candidate.work_experience) && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <i className="ri-briefcase-line text-purple-600" />
            <span>Education & Experience</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {candidate.education && (
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Education Background
                </span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {candidate.education}
                </p>
              </div>
            )}

            {candidate.work_experience && (
              <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/70">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Work Experience Summary
                </span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {candidate.work_experience}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: Skills, Languages & Tags */}
      {(skillsList.length > 0 || languagesList.length > 0 || tagsList.length > 0) && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-award-line text-amber-500" />
            <span>Skills, Languages & Tags</span>
          </h3>

          <div className="space-y-2">
            {skillsList.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 w-20">Skills:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/70"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languagesList.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 w-20">Languages:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {languagesList.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/70"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tagsList.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 w-20">Tags:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]"
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
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-file-text-line text-[#253C7D]" />
            <span>Recruiter Evaluation & Notes</span>
          </h3>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
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
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
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
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
            {candidate.notes ? (
              candidate.notes
            ) : (
              <span className="text-gray-400 italic">
                No recruiter notes added yet. Click &ldquo;Edit Notes&rdquo; to add screening thoughts or impressions.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
