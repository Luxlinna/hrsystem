import { memo, useState } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { WarningFileViewerModal } from "@/pages/disciplinary/components/WarningFileViewerModal";
import { ComplaintTableRow } from "./ComplaintTableRow";
import { ComplaintDetailModal } from "./ComplaintDetailModal";

interface ComplaintTableProps {
  records: ComplaintSuggestion[];
  loading: boolean;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onNew: () => void;
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
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Loading records…</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
          <i className="ri-feedback-line text-3xl text-sky-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">No complaints or suggestions recorded</p>
          <p className="text-xs text-gray-400 mt-1">
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
    <>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target To</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Subject &amp; Detail</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Suggestion</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Remark</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attachment</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <ComplaintTableRow
                  key={r.id}
                  r={r}
                  onSelect={setSelectedItem}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onPreview={(url, name) => setPreviewDoc({ url, name })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ComplaintDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onPreviewAttachment={(url, name) => setPreviewDoc({ url, name })}
      />

      {previewDoc && (
        <WarningFileViewerModal
          url={previewDoc.url}
          fileName={previewDoc.name}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
});
