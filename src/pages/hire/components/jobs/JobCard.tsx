import { memo } from "react";
import type { Job } from "../../types";

interface JobCardProps {
  job: Job;
  candidateCount: number;
  onEdit: (job: Job) => void;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  onAddCandidate: (jobId: string) => void;
}

export const JobCard = memo(function JobCard({
  job,
  candidateCount,
  onEdit,
  onClose,
  onReopen,
  onDelete,
  onAddCandidate,
}: JobCardProps) {
  const isActive = job.status === "active";

  return (
    <div
      className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group ${
        isActive ? "border-gray-200/80" : "border-gray-200/50 bg-gray-50/40 opacity-75"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                ● {job.status}
              </span>
              <span className="text-[11px] font-bold text-gray-400">
                {job.branches?.name || "General Headquarters"}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#253C7D] transition-colors line-clamp-1">
              {job.title}
            </h3>
          </div>

          <span className="text-xs font-black text-[#253C7D] bg-[#253C7D]/10 px-2.5 py-1 rounded-xl shrink-0">
            {candidateCount} Applicants
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <i className="ri-building-line text-gray-400" />
            {job.department}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <i className="ri-map-pin-line text-gray-400" />
            {job.location}
          </span>
          <span>·</span>
          <span className="capitalize">{job.type}</span>
        </div>

        {job.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
            {job.description}
          </p>
        )}

        {(job.salary_min > 0 || job.salary_max > 0) && (
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs mb-3">
            <span className="text-gray-400 font-medium">Compensation:</span>
            <span className="font-extrabold text-gray-900">
              ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onAddCandidate(job.id)}
          className="text-xs font-bold text-[#253C7D] hover:bg-[#253C7D]/10 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <i className="ri-user-add-line" />
          + Candidate
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(job)}
            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Posting"
          >
            <i className="ri-edit-line text-sm" />
          </button>

          {isActive ? (
            <button
              onClick={() => onClose(job.id)}
              className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              title="Close Posting"
            >
              <i className="ri-archive-line text-sm" />
            </button>
          ) : (
            <button
              onClick={() => onReopen(job.id)}
              className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Reopen Posting"
            >
              <i className="ri-restart-line text-sm" />
            </button>
          )}

          <button
            onClick={() => onDelete(job.id, job.title)}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Posting"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
});
