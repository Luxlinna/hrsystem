import { useState, memo } from "react";

interface ScheduleMatrixHeaderProps {
  activeTab: "schedules" | "no_schedules";
  setActiveTab: (tab: "schedules" | "no_schedules") => void;
  unscheduledCount: number;
  onNavigateToTemplates?: () => void;
  onNavigateToShifts?: () => void;
}

export const ScheduleMatrixHeader = memo(function ScheduleMatrixHeader({
  activeTab,
  setActiveTab,
  unscheduledCount,
  onNavigateToTemplates,
  onNavigateToShifts,
}: ScheduleMatrixHeaderProps) {
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
            Attendance Schedule
          </h1>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setHeaderMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Attendance Schedule</span>
            <i className={`ri-arrow-down-s-line transition-transform ${headerMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {headerMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setHeaderMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onNavigateToTemplates?.();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <i className="ri-layout-grid-line text-sm text-[#253C7D]" />
                  Manage Schedule Templates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onNavigateToShifts?.();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <i className="ri-time-line text-sm text-amber-600" />
                  Shift Manager Definitions
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    window.print();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <i className="ri-printer-line text-sm text-gray-400" />
                  Print / Export Schedule
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("schedules")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "schedules"
              ? "border-[#253C7D] text-[#253C7D]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Scheduled Staff
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("no_schedules")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "no_schedules"
              ? "border-[#253C7D] text-[#253C7D]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>Unscheduled Staff</span>
          {unscheduledCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {unscheduledCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});
