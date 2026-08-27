import { memo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { OnboardingDoc, OnboardingRequest } from "../../types";

interface OnboardingDocumentItemProps {
  doc: OnboardingDoc;
  request: OnboardingRequest;
  isOverdue: boolean;
  onOpenEditDocModal: (req: OnboardingRequest, doc: OnboardingDoc) => void;
  onRefresh: () => void;
}

export const OnboardingDocumentItem = memo(function OnboardingDocumentItem({
  doc,
  request,
  isOverdue,
  onOpenEditDocModal,
  onRefresh,
}: OnboardingDocumentItemProps) {
  const isDone = doc.status === "complete";

  const toggleStatus = async () => {
    const nextStatus = isDone ? "pending" : "complete";
    const { error } = await supabase
      .from("onboarding_documents")
      .update({ status: nextStatus })
      .eq("id", doc.id);
    if (error) {
      toast("Error", "Failed to update document status", "error");
    } else {
      toast(nextStatus === "complete" ? "Item Completed" : "Item Reopened", "", "success");
      onRefresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete checklist item "${doc.document_name}"?`)) return;
    const { error } = await supabase
      .from("onboarding_documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", doc.id);
    if (error) {
      toast("Error", "Failed to delete item", "error");
    } else {
      toast("Deleted", "Item removed from checklist", "success");
      onRefresh();
    }
  };

  return (
    <div
      className={`p-3 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
        isDone
          ? "bg-emerald-50/40 border-emerald-100"
          : isOverdue
          ? "bg-rose-50/40 border-rose-200"
          : "bg-white border-gray-200/80 hover:bg-slate-50/80"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          onClick={toggleStatus}
          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isDone
              ? "bg-emerald-500 border-emerald-600 text-white shadow-2xs"
              : "border-gray-300 hover:border-[#253C7D] bg-white"
          }`}
        >
          {isDone && <i className="ri-check-line text-xs font-black" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className={`font-extrabold truncate ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
              {doc.document_name}
            </p>
            {doc.file_url && (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 flex items-center gap-0.5 hover:underline"
              >
                <i className="ri-attachment-line" />
                <span>File attached</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 flex-wrap">
            {doc.due_date && (
              <span className={`font-semibold ${isOverdue ? "text-rose-600 font-bold" : ""}`}>
                Due: {new Date(doc.due_date).toLocaleDateString()} {isOverdue && "(Overdue)"}
              </span>
            )}
            {doc.notes && <span className="truncate max-w-[200px]">&middot; {doc.notes}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onOpenEditDocModal(request, doc)}
          className="p-1 text-gray-400 hover:text-[#253C7D] rounded hover:bg-gray-100 transition-colors cursor-pointer"
          title="Edit"
        >
          <i className="ri-edit-line text-xs" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete"
        >
          <i className="ri-delete-bin-line text-xs" />
        </button>
      </div>
    </div>
  );
});
