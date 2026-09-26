import { memo } from "react";

interface ScheduleMatrixNoSchedulesProps {
  onNavigateToTemplates?: () => void;
}

export const ScheduleMatrixNoSchedules = memo(function ScheduleMatrixNoSchedules({
  onNavigateToTemplates,
}: ScheduleMatrixNoSchedulesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-xs">
      <div className="max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
          <i className="ri-user-add-line" />
        </div>
        <h3 className="text-base font-bold text-gray-900">All Employees Have Scheduled Rosters</h3>
        <p className="text-xs text-gray-500">
          There are currently no active employees without an assigned schedule template. Every team member has their monthly rotation set.
        </p>
        <button
          type="button"
          onClick={onNavigateToTemplates}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
        >
          <i className="ri-layout-grid-line" />
          Manage Schedule Templates
        </button>
      </div>
    </div>
  );
});
