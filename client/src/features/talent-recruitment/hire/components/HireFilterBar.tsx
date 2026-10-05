import { memo } from "react";
import type { Branch, Job, HireTab } from "../types";
import { PIPELINE_STAGES, STAGE_CONFIG } from "../constants";

interface HireFilterBarProps {
  activeTab: HireTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterJobStatus: string;
  setFilterJobStatus: (status: string) => void;
  filterDepartment?: string;
  setFilterDepartment?: (dept: string) => void;
  filterBranch?: string;
  setFilterBranch?: (branch: string) => void;
  filterCandidateStage: string;
  setFilterCandidateStage: (stage: string) => void;
  filterCandidateJob: string;
  setFilterCandidateJob: (jobId: string) => void;
  filterInterviewStatus: string;
  setFilterInterviewStatus: (status: string) => void;
  jobViewMode: "grid" | "list";
  setJobViewMode: (mode: "grid" | "list") => void;
  candidateViewMode: "cards" | "list";
  setCandidateViewMode: (mode: "cards" | "list") => void;
  departments?: string[];
  branches?: Branch[];
  jobs: Job[];
}

export const HireFilterBar = memo(function HireFilterBar({
  activeTab,
  searchQuery,
  setSearchQuery,
  filterJobStatus,
  setFilterJobStatus,
  filterCandidateStage,
  setFilterCandidateStage,
  filterCandidateJob,
  setFilterCandidateJob,
  filterInterviewStatus,
  setFilterInterviewStatus,
  jobViewMode,
  setJobViewMode,
  candidateViewMode,
  setCandidateViewMode,
  jobs,
}: HireFilterBarProps) {
  const isJobs = activeTab === "jobs";
  const isCandidates = activeTab === "candidates";
  const isInterviews = activeTab === "interviews";

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-wrap flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isJobs ? "Search jobs..." : isCandidates ? "Search candidates..." : "Search..."}
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* Dynamic Status Filter Pills */}
        {isJobs && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "All Jobs", count: jobs.length },
              { key: "active", label: "Active Only", count: jobs.filter((j) => j.status === "active").length },
              { key: "closed", label: "Closed", count: jobs.filter((j) => j.status === "closed").length },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setFilterJobStatus(p.key)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterJobStatus === p.key ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${filterJobStatus === p.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {p.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {isCandidates && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCandidateStage("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                filterCandidateStage === "all" ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
              }`}
            >
              All Stages
            </button>
            {PIPELINE_STAGES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterCandidateStage(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterCandidateStage === st ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
                }`}
              >
                {STAGE_CONFIG[st]?.label || st}
              </button>
            ))}
          </div>
        )}

        {isInterviews && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "All Interviews" },
              { key: "scheduled", label: "Scheduled" },
              { key: "completed", label: "Completed" },
              { key: "cancelled", label: "Cancelled" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setFilterInterviewStatus(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  filterInterviewStatus === p.key ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Vacancy select & View Mode buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {isCandidates && (
          <select
            value={filterCandidateJob}
            onChange={(e) => setFilterCandidateJob(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">All Vacancies</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
          <button
            type="button"
            onClick={() => (isJobs ? setJobViewMode("grid") : setCandidateViewMode("cards"))}
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              (isJobs ? jobViewMode === "grid" : candidateViewMode === "cards") ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-layout-grid-fill" />
          </button>
          <button
            type="button"
            onClick={() => (isJobs ? setJobViewMode("list") : setCandidateViewMode("list"))}
            className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              (isJobs ? jobViewMode === "list" : candidateViewMode === "list") ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-list-check" />
          </button>
        </div>
      </div>
    </div>
  );
});
