import { memo, useState } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

interface ComplaintTableProps {
  records: ComplaintSuggestion[];
  loading: boolean;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onNew: () => void;
}

function TypeBadge({ type }: { type: ComplaintSuggestion["type"] }) {
  const cfg = COMPLAINT_TYPE_CONFIG[type] ?? COMPLAINT_TYPE_CONFIG.complaint;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <i className={`${cfg.icon} text-[10px]`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = COMPLAINT_STATUS_CONFIG[status] ?? COMPLAINT_STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <i className={`${cfg.icon} text-[10px]`} />
      {cfg.label}
    </span>
  );
}

export const ComplaintTable = memo(function ComplaintTable({
  records,
  loading,
  onEdit,
  onDelete,
  onUpdateStatus,
  onNew,
}: ComplaintTableProps) {
  const [selectedItem, setSelectedItem] = useState<ComplaintSuggestion | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading records…</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
          <i className="ri-feedback-line text-3xl text-purple-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">No complaints or suggestions recorded</p>
          <p className="text-xs text-gray-400 mt-1">
            Log feedback, workplace grievances, or improvement suggestions for your BU.
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
          style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
        >
          <i className="ri-add-line" />
          Create First Entry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target To</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Subject & Detail</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Suggestion</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Remark</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attachment</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/70 transition-colors group">
                  {/* Date */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-800">{r.entry_date}</span>
                  </td>

                  {/* Type Badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <TypeBadge type={r.type} />
                  </td>

                  {/* Target To */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <i className="ri-user-shared-line text-xs text-gray-400" />
                      <span className="text-xs font-semibold text-gray-900">{r.target_to}</span>
                    </div>
                    {r.employees && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        By: {r.employees.first_name} {r.employees.last_name}
                      </p>
                    )}
                  </td>

                  {/* Subject & Detail */}
                  <td className="px-4 py-3.5 max-w-64 cursor-pointer" onClick={() => setSelectedItem(r)}>
                    <p className="text-xs font-bold text-gray-900 truncate hover:text-[#7C3AED]">
                      {r.subject}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{r.details}</p>
                  </td>

                  {/* Suggestion */}
                  <td className="px-4 py-3.5 max-w-44">
                    <p className="text-xs text-gray-600 truncate" title={r.suggestion ?? ""}>
                      {r.suggestion || <span className="text-gray-300">—</span>}
                    </p>
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="relative inline-block group/status">
                      <StatusBadge status={r.status} />
                      <select
                        value={r.status}
                        onChange={(e) => onUpdateStatus(r.id, e.target.value as ComplaintStatus)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Change status"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="in_review">Under Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </td>

                  {/* Remark */}
                  <td className="px-4 py-3.5 max-w-44">
                    <p className="text-xs text-gray-600 truncate" title={r.remark ?? ""}>
                      {r.remark || <span className="text-gray-300">—</span>}
                    </p>
                  </td>

                  {/* Attachment (AWS S3) */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {r.attachment_url ? (
                      <a
                        href={r.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-semibold py-1 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <i className="ri-attachment-line text-xs" />
                        <span className="max-w-24 truncate">{r.attachment_name || "File"}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedItem(r)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="View details"
                      >
                        <i className="ri-eye-line text-sm" />
                      </button>
                      <button
                        onClick={() => onEdit(r)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit entry"
                      >
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal View */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TypeBadge type={selectedItem.type} />
                  <StatusBadge status={selectedItem.status} />
                </div>
                <h3 className="text-base font-extrabold text-gray-900">{selectedItem.subject}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Date: {selectedItem.entry_date} · To: {selectedItem.target_to}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Details
              </label>
              <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                {selectedItem.details}
              </p>
            </div>

            {selectedItem.suggestion && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Proposed Suggestion
                </label>
                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  {selectedItem.suggestion}
                </p>
              </div>
            )}

            {selectedItem.remark && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  HR Remark / Action Notes
                </label>
                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  {selectedItem.remark}
                </p>
              </div>
            )}

            {selectedItem.attachment_url && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Attached Document (AWS S3)
                </label>
                <a
                  href={selectedItem.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                >
                  <i className="ri-file-download-line text-sm" />
                  {selectedItem.attachment_name || "Download Attached File"}
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
