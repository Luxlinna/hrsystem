import { memo } from "react";
import type { JobStatus } from "../../types";

interface JobStatusesTableProps {
  jobStatuses: JobStatus[];
  loading: boolean;
  canManage?: boolean;
  onCreateNew: () => void;
  onView: (item: JobStatus) => void;
  onEdit: (item: JobStatus) => void;
  onToggleStatus: (item: JobStatus) => void;
  onDelete: (item: JobStatus) => void;
}

export const JobStatusesTable = memo(function JobStatusesTable({
  jobStatuses,
  loading,
  canManage = true,
  onCreateNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: JobStatusesTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <i className="ri-user-follow-line text-[#0088cc]" />
            <span>Job Status Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure employee employment and onboarding statuses for this Business Unit.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onCreateNew}
            className="px-3.5 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-add-line text-sm" />
            <span>Add Job Status</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Status Name</th>
              <th className="py-2.5 px-4">System Code</th>
              <th className="py-2.5 px-4">Badge Preview</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <i className="ri-loader-4-line animate-spin text-lg inline-block mr-2" />
                  Loading job statuses...
                </td>
              </tr>
            ) : jobStatuses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No job statuses configured.
                </td>
              </tr>
            ) : (
              jobStatuses.map((item, idx) => {
                const isActive = item.status === "active";
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {item.code || item.name.toLowerCase().replace(/\s+/g, "_")}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded text-white whitespace-nowrap"
                        style={{ backgroundColor: item.color || "#3b82f6" }}
                      >
                        {item.name}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => canManage && onToggleStatus(item)}
                        disabled={!canManage}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onView(item)}
                          className="w-6 h-6 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                          title="View"
                        >
                          <i className="ri-eye-line text-xs" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="w-6 h-6 rounded text-sky-600 hover:text-sky-800 hover:bg-sky-50 flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <i className="ri-edit-line text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item)}
                              className="w-6 h-6 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line text-xs" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
