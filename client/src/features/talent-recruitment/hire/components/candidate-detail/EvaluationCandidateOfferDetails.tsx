import { memo } from "react";

interface EvaluationCandidateOfferDetailsProps {
  offerDepartment: string;
  setOfferDepartment: (v: string) => void;
  director: string;
  setDirector: (v: string) => void;
  officerPosition: string;
  setOfficerPosition: (v: string) => void;
  onBoardDate: string;
  setOnBoardDate: (v: string) => void;
  probationSalary: string;
  setProbationSalary: (v: string) => void;
  afterProbationSalary: string;
  setAfterProbationSalary: (v: string) => void;
}

export const EvaluationCandidateOfferDetails = memo(function EvaluationCandidateOfferDetails({
  offerDepartment,
  setOfferDepartment,
  director,
  setDirector,
  officerPosition,
  setOfficerPosition,
  onBoardDate,
  setOnBoardDate,
  probationSalary,
  setProbationSalary,
  afterProbationSalary,
  setAfterProbationSalary,
}: EvaluationCandidateOfferDetailsProps) {
  return (
    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-file-paper-2-line text-[#253C7D]" />
          Offer Details (For Successful Applicants Only)
        </span>
        <span className="text-[10px] text-gray-400 font-semibold">Included in Results Form</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Office Department
          </label>
          <input
            type="text"
            value={offerDepartment}
            onChange={(e) => setOfferDepartment(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="Department name"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Director / Unit
          </label>
          <input
            type="text"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="Director title / Unit"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Officer Position
          </label>
          <input
            type="text"
            value={officerPosition}
            onChange={(e) => setOfficerPosition(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="Position title"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            On-Board Date
          </label>
          <input
            type="text"
            value={onBoardDate}
            onChange={(e) => setOnBoardDate(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="e.g. YYYY-MM-DD"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Probation Salary
          </label>
          <input
            type="text"
            value={probationSalary}
            onChange={(e) => setProbationSalary(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="e.g. $1,200 (Net)"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            After Probation Salary
          </label>
          <input
            type="text"
            value={afterProbationSalary}
            onChange={(e) => setAfterProbationSalary(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800"
            placeholder="e.g. $1,500 (Net)"
          />
        </div>
      </div>
    </div>
  );
});
