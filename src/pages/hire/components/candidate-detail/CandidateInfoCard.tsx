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
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Contact & Application Info
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Email Address
            </span>
            <p className="text-xs font-bold text-gray-900 mt-1 select-all">{candidate.email}</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Phone Number
            </span>
            <p className="text-xs font-bold text-gray-900 mt-1 select-all">
              {candidate.phone || "Not provided"}
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Sourcing Channel
            </span>
            <p className="text-xs font-bold text-gray-900 mt-1">{candidate.source || "Website"}</p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Assigned Branch
            </span>
            <p className="text-xs font-bold text-gray-900 mt-1">
              {candidate.job_postings?.branches?.name || "General HQ"}
            </p>
          </div>
        </div>
      </div>

      {/* Recruiter Evaluation Notes */}
      <div className="pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Recruiter Evaluation & Notes
          </h3>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
            >
              Edit Notes
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
                className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-4 border border-gray-100 leading-relaxed min-h-[70px]">
            {candidate.notes || "No candidate evaluation notes recorded yet."}
          </p>
        )}
      </div>
    </div>
  );
});
