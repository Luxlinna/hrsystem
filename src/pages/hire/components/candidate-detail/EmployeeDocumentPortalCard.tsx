import { memo, useCallback } from "react";
import type { Candidate, CandidateDocument, DocumentVerificationStatus } from "../../types";
import {
  REQUIRED_DOCUMENT_SLOTS,
  findSlotDocument,
  getPortalCompletionStats,
  type DocumentSlotConfig,
} from "../../constants/documentPortalConfig";
import { DocumentSlotItem } from "./DocumentSlotItem";
import { uploadFile } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface EmployeeDocumentPortalCardProps {
  candidate: Candidate;
  onUploadDocuments?: (docs: CandidateDocument[]) => Promise<void>;
  onDeleteDocument?: (url: string) => void;
  onUpdateCandidate?: (updater: (prev: Candidate | null) => Candidate | null) => void;
}

export const EmployeeDocumentPortalCard = memo(function EmployeeDocumentPortalCard({
  candidate,
  onUploadDocuments,
  onDeleteDocument,
  onUpdateCandidate,
}: EmployeeDocumentPortalCardProps) {
  const documents = candidate.documents || [];
  const stats = getPortalCompletionStats(documents);

  const handleSlotUpload = useCallback(
    async (slot: DocumentSlotConfig, file: File) => {
      try {
        const ext = file.name.split(".").pop() || "pdf";
        const path = `candidates/${candidate.id}/portal/${slot.key}_${Date.now()}.${ext}`;
        const url = await uploadFile("attachments", path, file);

        const newDoc: CandidateDocument = {
          name: `${slot.title} (${file.name})`,
          url,
          size: file.size,
          type: file.type || "application/pdf",
          uploaded_at: new Date().toISOString(),
          stage_key: "documents",
          notes: `Uploaded for pre-boarding slot: ${slot.title}`,
          doc_slot_key: slot.key,
          verification_status: "uploaded",
          rejection_reason: undefined,
        };

        const existingDocs = candidate.documents || [];
        const filteredDocs = existingDocs.filter(
          (d: any) => d.doc_slot_key !== slot.key && !findSlotDocument(slot.key, [d])
        );
        const updatedDocs = [...filteredDocs, newDoc];

        await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
        if (onUpdateCandidate) {
          onUpdateCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
        }
        if (onUploadDocuments) {
          await onUploadDocuments([newDoc]);
        }
        toast("Document Uploaded", `${slot.title} uploaded and set to "Uploaded" status.`, "success");
      } catch (err: any) {
        console.error("Slot upload error:", err);
        toast("Upload Error", `Failed to upload ${slot.title}: ${err.message || "Unknown error"}`, "error");
      }
    },
    [candidate.id, candidate.documents, onUploadDocuments, onUpdateCandidate]
  );

  const handleUpdateStatus = useCallback(
    async (slotKey: string, status: DocumentVerificationStatus, reason?: string) => {
      try {
        const existingDocs = candidate.documents || [];
        const updatedDocs = existingDocs.map((d: any) => {
          if (d.doc_slot_key === slotKey || findSlotDocument(slotKey, [d])) {
            return {
              ...d,
              doc_slot_key: slotKey,
              verification_status: status,
              rejection_reason: status === "rejected" ? reason : undefined,
              reviewed_at: new Date().toISOString(),
            };
          }
          return d;
        });

        const { error } = await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
        if (error) throw error;

        if (onUpdateCandidate) {
          onUpdateCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
        }
        toast(
          status === "verified" ? "Document Verified" : status === "rejected" ? "Document Rejected" : "Status Updated",
          `Document status updated to ${status.replace("_", " ")}.`,
          status === "rejected" ? "error" : "success"
        );
      } catch (err: any) {
        toast("Update Failed", err.message || "Could not update status", "error");
      }
    },
    [candidate.id, candidate.documents, onUpdateCandidate]
  );

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
      {/* Header with Title & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <i className="ri-folder-shield-2-line text-lg" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              Employee Document Portal
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              10.1 & 10.2 Document Status
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-10">
            Tracked independently: Missing / Uploaded / Under Review / Verified / Rejected
          </p>
        </div>

        {/* Progress Pill & Breakdown */}
        <div className="sm:text-right shrink-0">
          <div className="flex items-center sm:justify-end gap-2 text-xs font-bold text-gray-800 mb-1">
            <span>Verified:</span>
            <span className={stats.isAllComplete ? "text-emerald-700" : "text-blue-700"}>
              {stats.verifiedRequired} of {stats.totalRequired} Required ({stats.percentage}%)
            </span>
            {stats.totalRejected > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold">
                {stats.totalRejected} Rejected
              </span>
            )}
          </div>
          <div className="w-48 sm:w-56 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
            <div
              className={`h-full transition-all duration-500 ${stats.isAllComplete ? "bg-emerald-500" : "bg-blue-600"}`}
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9 Required Document Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {REQUIRED_DOCUMENT_SLOTS.map((slot) => {
          const doc = findSlotDocument(slot.key, documents);
          return (
            <DocumentSlotItem
              key={slot.key}
              slot={slot}
              doc={doc}
              onUpload={handleSlotUpload}
              onDelete={onDeleteDocument || (() => {})}
              onUpdateStatus={handleUpdateStatus}
            />
          );
        })}
      </div>
    </div>
  );
});
