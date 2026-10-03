import { memo } from "react";

interface RecycleBinHeaderProps {
  working: boolean;
  onRefresh: () => void;
}

export const RecycleBinHeader = memo(function RecycleBinHeader({
  working,
  onRefresh,
}: RecycleBinHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1
          className="text-2xl font-semibold text-gray-900"
        >
          Recycle Bin
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Deleted items are kept here so they can be restored. Deleting them forever cannot be undone.
        </p>
      </div>
      <button
        onClick={onRefresh}
        disabled={working}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
      >
        <i className="ri-refresh-line" />
        Refresh
      </button>
    </div>
  );
});
