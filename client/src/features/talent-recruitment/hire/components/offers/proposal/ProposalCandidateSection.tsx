import { memo } from "react";
import type { Candidate, HiringRequest } from "../../../types";

interface ProposalCandidateSectionProps {
  candidate?: Candidate | null;
  activeCandidate: Candidate | null;
  eligibleCandidates: Candidate[];
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  matchedReq: HiringRequest | null;
  hiringRequests: HiringRequest[];
  selectedReqId: string;
  setSelectedReqId: (id: string) => void;
}

export const ProposalCandidateSection = memo(function ProposalCandidateSection({
  candidate,
  activeCandidate,
  eligibleCandidates,
  selectedCandidateId,
  setSelectedCandidateId,
  matchedReq,
  hiringRequests,
  selectedReqId,
  setSelectedReqId,
}: ProposalCandidateSectionProps) {
  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-user-star-line text-blue-600" /> Candidate &amp; Requisition Reference
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          ✓ Auto-bound from System
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Selected Candidate</label>
          {candidate ? (
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>{candidate.full_name}</span>
              <span className="text-xs font-normal text-slate-500">{candidate.email || candidate.phone}</span>
            </div>
          ) : eligibleCandidates.length === 0 ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800">
              No eligible candidates available &mdash; all candidates at this stage already have active salary proposals.
            </div>
          ) : (
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {eligibleCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {c.job_postings?.title || "Applicant"} ({c.stage.replace(/_/g, " ")})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Associated Requisition / Job</label>
          <select
            value={matchedReq?.id || selectedReqId}
            onChange={(e) => setSelectedReqId(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {matchedReq && (
              <option value={matchedReq.id}>
                {matchedReq.title} ({matchedReq.department}) — {matchedReq.business_unit || "OPS"}
              </option>
            )}
            {hiringRequests
              .filter((r) => r.id !== matchedReq?.id)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.department}) — Budget: ${r.salary_min || 0} - ${r.salary_max || 0}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Readonly info summary pills */}
      <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
          <span className="font-semibold text-slate-800">
            {matchedReq?.title || activeCandidate?.job_postings?.title || "Specialist"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
          <span className="font-semibold text-slate-800">
            {matchedReq?.department || activeCandidate?.job_postings?.department || "Operations"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Req Budget</span>
          <span className="font-semibold text-blue-700">
            {matchedReq?.salary_min ? `$${matchedReq.salary_min} – $${matchedReq.salary_max}` : "Open"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Candidate Ask</span>
          <span className="font-semibold text-emerald-700">
            {activeCandidate?.expected_salary ? `$${activeCandidate.expected_salary}/mo` : "Not specified"}
          </span>
        </div>
      </div>
    </div>
  );
});
