import { memo } from "react";
import type { Enrollment } from "../../types";
import { pageWindow } from "../../trainingUtils";
import { EnrollmentTableRow } from "./EnrollmentTableRow";

interface EnrollmentsTableViewProps {
  pagedEnrollments: Enrollment[];
  totalFiltered: number;
  page: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  setPage: (p: number) => void;
  canManage: boolean;
  onUpdate: (id: string, updates: Partial<Enrollment>) => void;
  onDelete: (e: Enrollment) => void;
}

export const EnrollmentsTableView = memo(function EnrollmentsTableView({
  pagedEnrollments,
  totalFiltered,
  page,
  totalPages,
  pageStart,
  pageEnd,
  setPage,
  canManage,
  onUpdate,
  onDelete,
}: EnrollmentsTableViewProps) {
  if (totalFiltered === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-group-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No enrollments match your filter</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3">Learner</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3 text-center">Certificate</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedEnrollments.map((enrollment) => (
              <EnrollmentTableRow
                key={enrollment.id}
                enrollment={enrollment}
                canManage={canManage}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-800">{pageStart}</span> to{" "}
            <span className="font-bold text-gray-800">{pageEnd}</span> of{" "}
            <span className="font-bold text-gray-800">{totalFiltered}</span> enrollments
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Previous
            </button>

            {pageWindow(page, totalPages).map((item, idx) =>
              item === "..." ? (
                <span key={`dots-${idx}`} className="px-1 text-gray-400 font-bold">
                  &hellip;
                </span>
              ) : (
                <button
                  key={`page-${item}`}
                  onClick={() => setPage(item as number)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    page === item
                      ? "bg-[#253C7D] text-white shadow-2xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
