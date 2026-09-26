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
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Attendance Schedule</h1>

        <div className="relative">
          <button
            type="button"
            onClick={() => setHeaderMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
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

      {/* Subheader Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("schedules")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "schedules"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Schedules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("no_schedules")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === "no_schedules"
              ? "text-[#2563EB] border-b-2 border-[#2563EB]"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          No Schedules
          {unscheduledCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 font-mono">
              {unscheduledCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});
