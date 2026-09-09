import { memo, useState } from "react";
import type { Candidate, Job, CandidateApplication } from "../../types";
import { STAGE_CONFIG } from "../../constants";
import { formatDateTime } from "../../hireUtils";

interface CandidateApplicationsCardProps {
  candidate: Candidate;
  jobs?: Job[];
  onAddApplication?: (jobPostingId: string, source?: string, notes?: string) => Promise<boolean>;
}

export const CandidateApplicationsCard = memo(function CandidateApplicationsCard({
  candidate,
  jobs = [],
  onAddApplication,
}: CandidateApplicationsCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Combine applications from candidate_applications or fallback to primary application
  const applications: CandidateApplication[] = candidate.applications && candidate.applications.length > 0
    ? candidate.applications
    : candidate.job_posting_id
    ? [
        {
          id: "primary",
          candidate_id: candidate.id,
          job_posting_id: candidate.job_posting_id,
          stage: candidate.stage,
          rating: candidate.rating,
          source: candidate.source,
          applied_at: candidate.applied_at,
          outcome: candidate.stage === "hired" ? "hired" : candidate.stage === "rejected" ? "rejected" : "in_progress",
          notes: candidate.notes,
          job_postings: candidate.job_postings ? {
            id: candidate.job_postings.id,
            title: candidate.job_postings.title,
            department: candidate.job_postings.department,
            branches: candidate.job_postings.branches,
          } : null,
        },
      ]
    : [];

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !onAddApplication) return;
    setSubmitting(true);
    const ok = await onAddApplication(selectedJobId, candidate.source, notes);
    setSubmitting(false);
    if (ok) {
      setShowAddModal(false);
      setSelectedJobId("");
      setNotes("");
    }
  };

  const getOutcomeBadge = (outcome?: string) => {
    switch (outcome) {
      case "hired":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Hired</span>;
      case "rejected":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Rejected</span>;
      case "withdrawn":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">Withdrawn</span>;
      case "on_hold":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">On Hold</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">In Progress</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-history-line text-[#253C7D]" />
              <span>Full Candidate History & Applications</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {applications.length} {applications.length === 1 ? "Application" : "Applications"}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Complete track record across all jobs this candidate applied for
          </p>
        </div>

        {onAddApplication && jobs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-add-line" /> Submit for Another Job
          </button>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400">
          No historical applications recorded.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-2.5">Vacancy / Position</th>
                <th className="px-4 py-2.5">Department & Branch</th>
                <th className="px-4 py-2.5">Applied Date</th>
                <th className="px-4 py-2.5">Current Stage</th>
                <th className="px-4 py-2.5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {applications.map((app, idx) => {
                const stageCfg = STAGE_CONFIG[app.stage] || STAGE_CONFIG.applied;
                return (
                  <tr key={app.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">
                        {app.job_postings?.title || "General Application"}
                      </div>
                      {app.source && (
                        <span className="text-[10px] text-gray-400">via {app.source}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {app.job_postings?.department || "General"}
                      </div>
                      {app.job_postings?.branches?.name && (
                        <div className="text-[10px] text-gray-400">
                          {app.job_postings.branches.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[11px]">
                      {formatDateTime(app.applied_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stageCfg.bg} ${stageCfg.text} border ${stageCfg.border}`}>
                        <i className={`${stageCfg.icon} text-[10px]`} />
                        {stageCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getOutcomeBadge(app.outcome)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal to reuse profile and submit to another job */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Submit for Another Vacancy</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Reuses {candidate.full_name}&apos;s profile without re-entry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Target Vacancy Opening <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">Select vacancy...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Application Notes / Justification
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Why is candidate being considered for this position..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedJobId}
                  className="px-4 py-1.5 text-xs font-bold bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
