import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { ComplaintTableRow } from "./ComplaintTableRow";

interface ComplaintTableProps {
  records: ComplaintSuggestion[];
  loading: boolean;
  onSelect: (record: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreviewAttachment: (url: string, name: string) => void;
  onNew: () => void;
}

export const ComplaintTable = memo(function ComplaintTable({
  records,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreviewAttachment,
  onNew,
}: ComplaintTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading records…</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
          <i className="ri-feedback-line text-3xl text-sky-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">No complaints or suggestions recorded</p>
          <p className="text-xs text-slate-400 mt-1">
            Log feedback, workplace grievances, or improvement suggestions for your BU.
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer bg-[#0284c7] hover:bg-sky-700 transition-colors"
        >
          <i className="ri-add-line" />
          Create First Entry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target To</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject &amp; Detail</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggestion</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remark</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attachment</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <ComplaintTableRow
                key={r.id}
                r={r}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateStatus={onUpdateStatus}
                onPreview={onPreviewAttachment}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
