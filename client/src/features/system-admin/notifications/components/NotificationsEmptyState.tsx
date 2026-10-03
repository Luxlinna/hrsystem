import { memo } from "react";

interface NotificationsEmptyStateProps {
  filtersActive: boolean;
  onResetFilters: () => void;
}

export const NotificationsEmptyState = memo(function NotificationsEmptyState({
  filtersActive,
  onResetFilters,
}: NotificationsEmptyStateProps) {
  return (
    <div className="text-center py-20 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
        <i className="ri-notification-off-line text-2xl text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">
        {filtersActive ? "No notifications match your filters" : "You're all caught up"}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {filtersActive
          ? "Try adjusting or clearing your filters."
          : "New activity across the workspace will show up here."}
      </p>
      {filtersActive && (
        <button
          onClick={onResetFilters}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <i className="ri-filter-off-line text-sm" />
          Clear filters
        </button>
      )}
    </div>
  );
});
