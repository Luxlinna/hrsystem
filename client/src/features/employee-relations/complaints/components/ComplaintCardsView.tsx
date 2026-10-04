import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { ComplaintCard } from "./ComplaintCard";

interface ComplaintCardsViewProps {
  records: ComplaintSuggestion[];
  loading: boolean;
  onSelect: (record: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreviewAttachment: (url: string, name: string) => void;
  onNew: () => void;
}

export const ComplaintCardsView = memo(function ComplaintCardsView({
  records,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreviewAttachment,
  onNew,
}: ComplaintCardsViewProps) {
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
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
          <i className="ri-feedback-line" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Records Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          No complaints or suggestions found matching your active filters or search.
        </p>
        <button
          onClick={onNew}
          className="mt-4 px-4 py-2 bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          + New Entry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((r) => (
        <ComplaintCard
          key={r.id}
          record={r}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          onPreviewAttachment={onPreviewAttachment}
        />
      ))}
    </div>
  );
});
