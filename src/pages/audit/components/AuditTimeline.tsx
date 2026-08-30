import { memo } from "react";
import type { AuditLog } from "../types";
import { AuditLogItem } from "./AuditLogItem";
import { Pagination } from "./Pagination";

interface AuditTimelineProps {
  loading: boolean;
  filteredCount: number;
  pagedLogs: AuditLog[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
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
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
}: AuditTimelineProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Activity Timeline</span>
        <span className="text-xs text-gray-400">{filteredCount} events</span>
      </div>

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
    </div>
  );
});
