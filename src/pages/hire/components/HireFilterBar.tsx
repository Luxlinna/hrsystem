import { memo } from "react";
import type { Branch, Job, HireTab } from "../types";
import { PIPELINE_STAGES, STAGE_CONFIG } from "../constants";

interface HireFilterBarProps {
  activeTab: HireTab;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterJobStatus: string;
  setFilterJobStatus: (status: string) => void;
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
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
  departments: string[];
  branches: Branch[];
  jobs: Job[];
}

export const HireFilterBar = memo(function HireFilterBar({
  activeTab,
  searchQuery,
  setSearchQuery,
  filterJobStatus,
  setFilterJobStatus,
  filterDepartment,
  setFilterDepartment,
  filterBranch,
  setFilterBranch,
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
  departments,
  branches,
  jobs,
}: HireFilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === "jobs"
              ? "Search jobs by title, department, branch..."
              : activeTab === "candidates"
              ? "Search candidates by name, email, phone, role..."
              : activeTab === "interviews"
              ? "Search interviews by candidate, title, interviewer..."
              : "Search pipeline candidates..."
          }
          className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-circle-fill text-xs" />
          </button>
        )}
      </div>

      {/* Dynamic Contextual Filters based on Tab */}
      <div className="flex items-center gap-2 flex-wrap">
        {activeTab === "jobs" && (
          <>
            <select
              value={filterJobStatus}
              onChange={(e) => setFilterJobStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="closed">Closed / Archived</option>
            </select>

            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              <button
                onClick={() => setJobViewMode("grid")}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  jobViewMode === "grid" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-layout-grid-fill" />
              </button>
              <button
                onClick={() => setJobViewMode("list")}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  jobViewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-list-check" />
              </button>
            </div>
          </>
        )}

        {activeTab === "candidates" && (
          <>
            <select
              value={filterCandidateStage}
              onChange={(e) => setFilterCandidateStage(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="all">All Stages</option>
              {PIPELINE_STAGES.map((st) => (
                <option key={st} value={st}>
                  {STAGE_CONFIG[st]?.label || st}
                </option>
              ))}
            </select>

            <select
              value={filterCandidateJob}
              onChange={(e) => setFilterCandidateJob(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Vacancies</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              <button
                onClick={() => setCandidateViewMode("cards")}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  candidateViewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-layout-grid-fill" />
              </button>
              <button
                onClick={() => setCandidateViewMode("list")}
                className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  candidateViewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-table-line" />
              </button>
            </div>
          </>
        )}

        {activeTab === "interviews" && (
          <select
            value={filterInterviewStatus}
            onChange={(e) => setFilterInterviewStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-bold focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Interviews</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        )}

        {/* Global Department & Branch Dropdowns */}
        {departments.length > 0 && (
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}

        {branches.length > 0 && (
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
});
