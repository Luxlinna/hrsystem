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
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const RecruitmentActionsMetrics = memo(function RecruitmentActionsMetrics({
  counts,
  filterSection,
  onSelectFilterSection,
  searchQuery = "",
  setSearchQuery,
}: RecruitmentActionsMetricsProps) {
  const filterPills = [
    { key: "all" as const, label: "All Items", count: counts.total, icon: "ri-apps-2-line" },
    { key: "cv" as const, label: "Pending CV Review", count: counts.cvReviews, icon: "ri-file-user-line" },
    { key: "feedback" as const, label: "Interview Feedback Due", count: counts.feedbackDue, icon: "ri-feedback-line" },
    { key: "approvals" as const, label: "Approval Pending", count: counts.approvals, icon: "ri-shield-check-line" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search Input */}
      {setSearchQuery && (
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action items by applicant, role, requisition..."
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
      )}

      {/* Standard Site Theme Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        {filterPills.map((pill) => {
          const isActive = filterSection === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => onSelectFilterSection(pill.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200/80"
              }`}
            >
              <i className={`${pill.icon} text-xs ${isActive ? "text-white" : "text-[#253C7D]"}`} />
              <span>{pill.label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
