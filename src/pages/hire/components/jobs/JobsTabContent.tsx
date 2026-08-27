import { memo } from "react";
import type { Job, Candidate } from "../../types";
import { JobCard } from "./JobCard";

interface JobsTabContentProps {
  jobs: Job[];
  candidates: Candidate[];
  viewMode: "grid" | "list";
  onOpenCreateJob: () => void;
  onEditJob: (job: Job) => void;
  onCloseJob: (id: string) => void;
  onReopenJob: (id: string) => void;
  onDeleteJob: (id: string, title: string) => void;
  onAddCandidate: (jobId: string) => void;
}

export const JobsTabContent = memo(function JobsTabContent({
  jobs,
  candidates,
  viewMode,
  onOpenCreateJob,
  onEditJob,
  onCloseJob,
  onReopenJob,
  onDeleteJob,
  onAddCandidate,
}: JobsTabContentProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-briefcase-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Job Postings Found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No vacancies match your search query or selected department/branch filters.
        </p>
        <button
          onClick={onOpenCreateJob}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Post New Job
        </button>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3.5">Job Title</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Branch Location</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Applicants</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((j) => {
                const count = candidates.filter((c) => c.job_posting_id === j.id).length;
                const isActive = j.status === "active";

                return (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="font-extrabold text-gray-900 text-xs sm:text-sm">{j.title}</p>
                      <p className="text-[10px] text-gray-400">{j.location}</p>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                      {j.department}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                      {j.branches?.name || "General HQ"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap capitalize text-gray-600 font-semibold">
                      {j.type}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-black text-[#253C7D]">
                      {count} candidates
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        ● {j.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onAddCandidate(j.id)}
                          className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                        >
                          + Candidate
                        </button>
                        <button
                          onClick={() => onEditJob(j)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                        {isActive ? (
                          <button
                            onClick={() => onCloseJob(j.id)}
                            className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Close"
                          >
                            <i className="ri-archive-line text-sm" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onReopenJob(j.id)}
                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Reopen"
                          >
                            <i className="ri-restart-line text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteJob(j.id, j.title)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((j) => {
        const count = candidates.filter((c) => c.job_posting_id === j.id).length;
        return (
          <JobCard
            key={j.id}
            job={j}
            candidateCount={count}
            onEdit={onEditJob}
            onClose={onCloseJob}
            onReopen={onReopenJob}
            onDelete={onDeleteJob}
            onAddCandidate={onAddCandidate}
          />
        );
      })}
    </div>
  );
});
