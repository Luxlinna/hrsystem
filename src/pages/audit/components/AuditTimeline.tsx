import { memo, useState } from "react";
import type { AuditLog } from "../types";
import { AuditLogItem } from "./AuditLogItem";
import { Pagination } from "./Pagination";

interface AuditTimelineProps {
  loading: boolean;
  filteredCount: number;
  pagedLogs: AuditLog[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  onDeleteLogs: (ids: string[]) => Promise<void>;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export const AuditTimeline = memo(function AuditTimeline({
  loading,
  filteredCount,
  pagedLogs,
  expanded,
  toggleExpand,
  selectedIds,
  toggleSelect,
  selectAll,
  clearSelection,
  onDeleteLogs,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
}: AuditTimelineProps) {
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAllPageSelected =
    pagedLogs.length > 0 && pagedLogs.every((l) => selectedIds.has(l.id));
  const isSomePageSelected =
    pagedLogs.some((l) => selectedIds.has(l.id)) && !isAllPageSelected;

  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      const next = new Set(selectedIds);
      pagedLogs.forEach((l) => next.delete(l.id));
      selectAll(Array.from(next));
    } else {
      const next = new Set(selectedIds);
      pagedLogs.forEach((l) => next.add(l.id));
      selectAll(Array.from(next));
    }
  };

  const confirmSingleDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteLogs([logToDelete.id]);
      const next = new Set(selectedIds);
      next.delete(logToDelete.id);
      selectAll(Array.from(next));
      setLogToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await onDeleteLogs(Array.from(selectedIds));
      clearSelection();
      setShowBulkDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
      {/* Bulk Action Header when items are selected */}
      {selectedIds.size > 0 ? (
        <div className="px-5 py-3 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllPageSelected}
              ref={(el) => {
                if (el) el.indeterminate = isSomePageSelected;
              }}
              onChange={handleToggleSelectPage}
              className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]/30 cursor-pointer"
            />
            <span className="text-sm font-semibold text-[#253C7D]">
              {selectedIds.size} log{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
            >
              Deselect all
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm" />
              Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      ) : (
        /* Standard Header */
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pagedLogs.length > 0 && (
              <input
                type="checkbox"
                checked={isAllPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomePageSelected;
                }}
                onChange={handleToggleSelectPage}
                className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]/30 cursor-pointer"
                title="Select all on this page"
              />
            )}
            <span className="text-sm font-semibold text-gray-700">Activity Timeline</span>
          </div>
          <span className="text-xs text-gray-400">{filteredCount} events</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCount === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <i className="ri-file-search-line text-3xl mb-2" />
          <p className="text-sm">No audit events found</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-50">
            {pagedLogs.map((log) => (
              <AuditLogItem
                key={log.id}
                log={log}
                isExpanded={expanded.has(log.id)}
                onToggleExpand={toggleExpand}
                isSelected={selectedIds.has(log.id)}
                onToggleSelect={toggleSelect}
                onDelete={setLogToDelete}
              />
            ))}
          </div>

          <Pagination
            totalCount={filteredCount}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </>
      )}

      {/* Single Item Delete Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <i className="ri-delete-bin-line text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Audit Entry</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this audit record? This action will permanently remove it from the audit log.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl mb-5 text-xs text-gray-700 space-y-1 border border-gray-100">
              <div className="font-semibold text-gray-900">{logToDelete.description}</div>
              <div className="text-gray-400">
                Actor: {logToDelete.actor_name} &bull; BU: {logToDelete.branches?.name || (logToDelete.metadata?.business_unit as string) || "General"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmSingleDelete}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <i className="ri-delete-bin-2-line text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Delete {selectedIds.size} Audit {selectedIds.size > 1 ? "Entries" : "Entry"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to permanently delete the <span className="font-semibold text-gray-900">{selectedIds.size}</span> selected audit records? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line" />
                    Delete {selectedIds.size} Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
