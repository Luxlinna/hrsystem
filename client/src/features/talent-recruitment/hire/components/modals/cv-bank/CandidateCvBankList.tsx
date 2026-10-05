import { memo } from "react";
import type { Candidate } from "../../../types";
import { formatRelative, initials } from "../../../hireUtils";

interface CandidateCvBankListProps {
  candidates: Candidate[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  formatFilter: string;
  setFormatFilter: (f: string) => void;
  stageFilter: string;
  setStageFilter: (s: string) => void;
  onPreview: (c: Candidate) => void;
  onReupload: (candidateId: string, file: File) => void;
}

export const CandidateCvBankList = memo(function CandidateCvBankList({
  candidates,
  searchQuery,
  setSearchQuery,
  formatFilter,
  setFormatFilter,
  stageFilter,
  setStageFilter,
  onPreview,
  onReupload,
}: CandidateCvBankListProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Search & Filters */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 w-full">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, role, skills, or email..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All File Formats</option>
            <option value="pdf">PDF Documents (.pdf)</option>
            <option value="word">Word Files (.doc, .docx)</option>
            <option value="image">Scanned/Images (.png, .jpg)</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="applied">CV Received</option>
            <option value="screening">Screening</option>
            <option value="interview">Interviewing</option>
            <option value="offer">Offer Extended</option>
            <option value="hired">Hired</option>
          </select>
        </div>
      </div>

      {/* CV Records Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {candidates.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <i className="ri-folder-user-line text-4xl mb-2 text-slate-300 block" />
            <p className="text-sm font-bold text-slate-700">No Candidate CVs Found</p>
            <p className="text-xs text-slate-400 mt-1">No uploaded resumes match the active filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Applied Position</th>
                  <th className="px-4 py-3">Document / File</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {candidates.map((c) => {
                  const ext = (c.resume_name || c.resume_url || "").split(".").pop()?.toLowerCase() || "pdf";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                            {initials(c.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{c.full_name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {c.job_title || c.position || c.job_postings?.title || "General Application"}
                        </p>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {c.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                            {ext}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate max-w-[160px]" title={c.resume_name || "Resume"}>
                            {c.resume_name || "Candidate_CV.pdf"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {formatRelative(c.applied_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreview(c)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <i className="ri-eye-line text-xs" />
                            <span>Preview</span>
                          </button>
                          <label className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer" title="Replace / Update CV">
                            <i className="ri-upload-2-line text-xs" />
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onReupload(c.id, f);
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});
