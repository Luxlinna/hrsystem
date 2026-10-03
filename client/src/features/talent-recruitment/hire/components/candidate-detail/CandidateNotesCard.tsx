import { memo } from "react";
import type { Candidate } from "../../types";

interface CandidateNotesCardProps {
  candidate: Candidate;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesText: string;
  setNotesText: (text: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

export const CandidateNotesCard = memo(function CandidateNotesCard({
  candidate,
  isEditingNotes,
  setIsEditingNotes,
  notesText,
  setNotesText,
  savingNotes,
  onSaveNotes,
}: CandidateNotesCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900">Recruiter Notes</h2>
        {!isEditingNotes && (
          <button
            onClick={() => setIsEditingNotes(true)}
            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-edit-line text-xs" /> Edit Notes
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
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#172B4D]"
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
              className="px-4 py-1.5 bg-[#172B4D] hover:bg-[#0f1d35] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed min-h-[60px]">
          {candidate.notes || "No candidate evaluation notes recorded yet."}
        </div>
      )}
    </div>
  );
});
