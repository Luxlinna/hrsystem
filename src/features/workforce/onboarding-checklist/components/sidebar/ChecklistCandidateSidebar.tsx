import { memo } from "react";
import type { OnboardingHire } from "../../types";
import { CandidateListItem } from "./CandidateListItem";

interface ChecklistCandidateSidebarProps {
  hires: OnboardingHire[];
  selectedHire: OnboardingHire | null;
  hireSearch: string;
  setHireSearch: (q: string) => void;
  hireStatusTab: "all" | "in_progress" | "completed" | "pending";
  setHireStatusTab: (t: "all" | "in_progress" | "completed" | "pending") => void;
  getProgress: (hireId: string) => number;
  onSelectCandidate: (hire: OnboardingHire) => void;
}

export const ChecklistCandidateSidebar = memo(function ChecklistCandidateSidebar({
  hires,
  selectedHire,
  hireSearch,
  setHireSearch,
  hireStatusTab,
  setHireStatusTab,
  getProgress,
  onSelectCandidate,
}: ChecklistCandidateSidebarProps) {
  return (
    <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
      <div>
        <h3 className="font-extrabold text-sm text-gray-900">Active Candidates</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">Select a new hire to manage checklist</p>
      </div>

      {/* Candidate Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={hireSearch}
          onChange={(e) => setHireSearch(e.target.value)}
          placeholder="Filter candidates..."
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {hireSearch && (
          <button
            onClick={() => setHireSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Candidate Status Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-[10px] font-bold">
        {(["all", "in_progress", "completed", "pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setHireStatusTab(tab)}
            className={`py-1 rounded-lg capitalize transition-all cursor-pointer truncate ${
              hireStatusTab === tab
                ? "bg-white text-[#253C7D] shadow-2xs font-extrabold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab === "in_progress" ? "Active" : tab}
          </button>
        ))}
      </div>

      {/* Candidate List */}
      <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
        {hires.map((hire) => (
          <CandidateListItem
            key={hire.id}
            hire={hire}
            isSelected={selectedHire?.id === hire.id}
            progress={getProgress(hire.id)}
            onSelect={onSelectCandidate}
          />
        ))}

        {hires.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-400">
            No candidates match your search filter.
          </div>
        )}
      </div>
    </div>
  );
});
