import { memo } from "react";

export type ActionFilterSection = "all" | "cv" | "feedback" | "approvals";

interface RecruitmentActionsMetricsProps {
  counts: {
    cvReviews: number;
    feedbackDue: number;
    approvals: number;
    total: number;
  };
  filterSection: ActionFilterSection;
  onSelectFilterSection: (sec: ActionFilterSection) => void;
}

export const RecruitmentActionsMetrics = memo(function RecruitmentActionsMetrics({
  counts,
  filterSection,
  onSelectFilterSection,
}: RecruitmentActionsMetricsProps) {
  return (
    <div className="space-y-4">
      {/* 3 Interactive Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pending CV Review */}
        <button
          type="button"
          onClick={() => onSelectFilterSection(filterSection === "cv" ? "all" : "cv")}
          className={`p-5 rounded-3xl border transition-all text-left cursor-pointer ${
            filterSection === "cv"
              ? "bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
              : "bg-white hover:bg-amber-50/30 border-gray-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-lg">
              <i className="ri-file-search-line" />
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {counts.cvReviews} Pending
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">Pending CV Review</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Applicants awaiting stage review or screening advancement
          </p>
        </button>

        {/* Card 2: Interview Feedback Due */}
        <button
          type="button"
          onClick={() => onSelectFilterSection(filterSection === "feedback" ? "all" : "feedback")}
          className={`p-5 rounded-3xl border transition-all text-left cursor-pointer ${
            filterSection === "feedback"
              ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-400/20 shadow-xs"
              : "bg-white hover:bg-sky-50/30 border-gray-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-lg">
              <i className="ri-feedback-line" />
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {counts.feedbackDue} Due
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">Interview Feedback Due</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Scheduled/completed interviews missing evaluation scores
          </p>
        </button>

        {/* Card 3: Approval Pending */}
        <button
          type="button"
          onClick={() => onSelectFilterSection(filterSection === "approvals" ? "all" : "approvals")}
          className={`p-5 rounded-3xl border transition-all text-left cursor-pointer ${
            filterSection === "approvals"
              ? "bg-purple-500/10 border-purple-400 ring-2 ring-purple-400/20 shadow-xs"
              : "bg-white hover:bg-purple-50/30 border-gray-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-lg">
              <i className="ri-shield-check-line" />
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {counts.approvals} Awaiting
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">Approval Pending</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Headcount requisitions awaiting sign-off at your stage
          </p>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => onSelectFilterSection("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterSection === "all"
              ? "bg-gray-900 text-white shadow-2xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          All Items ({counts.total})
        </button>
        <button
          type="button"
          onClick={() => onSelectFilterSection("cv")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterSection === "cv"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          Pending CV Review ({counts.cvReviews})
        </button>
        <button
          type="button"
          onClick={() => onSelectFilterSection("feedback")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterSection === "feedback"
              ? "bg-sky-600 text-white shadow-2xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          Interview Feedback Due ({counts.feedbackDue})
        </button>
        <button
          type="button"
          onClick={() => onSelectFilterSection("approvals")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterSection === "approvals"
              ? "bg-purple-600 text-white shadow-2xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          Approval Pending ({counts.approvals})
        </button>
      </div>
    </div>
  );
});
