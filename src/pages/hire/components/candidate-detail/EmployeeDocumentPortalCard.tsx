import { memo, useCallback } from "react";
import type { Candidate, CandidateDocument, DocumentVerificationStatus } from "../../types";
import { REQUIRED_DOCUMENT_SLOTS, findSlotDocument, getPortalCompletionStats, type DocumentSlotConfig } from "../../constants/documentPortalConfig";
import { DocumentSlotItem } from "./DocumentSlotItem";
import { uploadFileToS3, deleteS3File, getS3KeyFromUrl } from "@/lib/s3-storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { notifyDocumentMissing } from "@/services/notifications/recruitmentNotificationTriggers";

interface EmployeeDocumentPortalCardProps {
  candidate: Candidate;
  onUploadDocuments?: (docs: CandidateDocument[]) => Promise<void>;
  onDeleteDocument?: (url: string) => void;
  onUpdateCandidate?: (updater: (prev: Candidate | null) => Candidate | null) => void;
}

export const EmployeeDocumentPortalCard = memo(function EmployeeDocumentPortalCard({
  candidate,
  onDeleteDocument,
  onUpdateCandidate,
}: EmployeeDocumentPortalCardProps) {
  const documents = candidate.documents || [];
  const stats = getPortalCompletionStats(documents);

  const handleSlotUpload = useCallback(
    async (slot: DocumentSlotConfig, file: File) => {
      try {
        const s3Item = await uploadFileToS3(file, `candidates/${candidate.id}/portal/${slot.key}`);
        const newDoc: CandidateDocument = {
          name: `${slot.title} (${file.name})`,
          url: s3Item.url,
          size: s3Item.size,
          type: s3Item.type || file.type || "application/pdf",
          uploaded_at: new Date().toISOString(),
          stage_key: "documents",
          notes: `Uploaded for pre-boarding slot: ${slot.title}`,
          doc_slot_key: slot.key,
          verification_status: "uploaded",
        };

        const existingDocs = candidate.documents || [];
        const filteredDocs = existingDocs.filter((d: any) => d.doc_slot_key !== slot.key && !findSlotDocument(slot.key, [d]));
        const updatedDocs = [...filteredDocs, newDoc];

        await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
        if (onUpdateCandidate) onUpdateCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
        toast("Document Uploaded", `${slot.title} uploaded to AWS S3.`, "success");
      } catch (err: any) {
        toast("Upload Error", `Failed to upload ${slot.title}: ${err.message || "Unknown error"}`, "error");
      }
    },
    [candidate.id, candidate.documents, onUpdateCandidate]
  );

  const handleDeleteSlot = useCallback(
    async (url: string, slotKey?: string) => {
      try {
        const key = getS3KeyFromUrl(url);
        if (key) deleteS3File(key).catch(() => {});

        const existingDocs = candidate.documents || [];
        const remainingDocs = existingDocs.filter((d: any) => (slotKey && d.doc_slot_key ? d.doc_slot_key !== slotKey : d.url !== url));

        await supabase.from("candidates").update({ documents: remainingDocs }).eq("id", candidate.id);
        if (onUpdateCandidate) onUpdateCandidate((prev) => (prev ? { ...prev, documents: remainingDocs } : prev));
        if (onDeleteDocument) onDeleteDocument(url);
        toast("Document Removed", "Document removed from slot.", "success");
      } catch (err: any) {
        toast("Delete Failed", err.message || "Could not delete document", "error");
      }
    },
    [candidate.id, candidate.documents, onUpdateCandidate, onDeleteDocument]
  );

  const handleUpdateStatus = useCallback(
    async (slotKey: string, status: DocumentVerificationStatus, reason?: string) => {
      try {
        const existingDocs = candidate.documents || [];
        const updatedDocs = existingDocs.map((d: any) =>
          d.doc_slot_key === slotKey || findSlotDocument(slotKey, [d])
            ? { ...d, doc_slot_key: slotKey, verification_status: status, rejection_reason: status === "rejected" ? reason : undefined, reviewed_at: new Date().toISOString() }
            : d
        );

        const { error } = await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
        if (error) throw error;
        if (onUpdateCandidate) onUpdateCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));

        // Canonical Notification Engine Dispatch (Event 13: Document missing on rejection)
        if (status === "rejected") {
          const slotConfig = REQUIRED_DOCUMENT_SLOTS.find((s) => s.key === slotKey);
          const docTitle = slotConfig ? slotConfig.title : slotKey;
          void notifyDocumentMissing({
            candidate,
            missingDocumentNames: [`${docTitle} (Rejected: ${reason || "Re-upload required"})`],
            businessUnit: candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
          }).catch((e) => console.error("[notifyDocumentMissing reject] error:", e));
        }

        toast(status === "verified" ? "Document Verified" : status === "rejected" ? "Document Rejected" : "Status Updated", `Document status updated to ${status.replace("_", " ")}.`, status === "rejected" ? "error" : "success");
      } catch (err: any) {
        toast("Update Failed", err.message || "Could not update status", "error");
      }
    },
    [candidate, onUpdateCandidate]
  );

  const missingSlots = REQUIRED_DOCUMENT_SLOTS.filter((slot) => {
    const doc = findSlotDocument(slot.key, documents);
    return !doc || doc.verification_status === "missing" || doc.verification_status === "rejected";
  });

  const handleNotifyMissing = useCallback(async () => {
    const missingNames = missingSlots.map((s) => s.title);
    if (missingNames.length === 0) {
      toast("All Documents Present", "No missing documents detected.", "info");
      return;
    }
    await notifyDocumentMissing({
      candidate,
      missingDocumentNames: missingNames,
      deadline: "Prior to contract finalization",
      businessUnit: candidate.job_postings?.branches?.name || "OPS Solutions Co ., Ltd",
    });
    toast("Missing Documents Alerted", `Dispatched notification for ${missingNames.length} missing document(s) via In-App & Telegram.`, "success");
  }, [candidate, missingSlots]);

  const handleVerifyAll = useCallback(async () => {
    try {
      const existingDocs = candidate.documents || [];
      const updatedDocs = existingDocs.map((d: any) => ({ ...d, verification_status: "verified", reviewed_at: new Date().toISOString() }));
      const { error } = await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
      if (error) throw error;
      if (onUpdateCandidate) onUpdateCandidate((prev) => (prev ? { ...prev, documents: updatedDocs } : prev));
      toast("All Documents Verified", "All uploaded documents marked as Verified.", "success");
    } catch (err: any) {
      toast("Verification Failed", err.message || "Could not verify documents", "error");
    }
  }, [candidate.id, candidate.documents, onUpdateCandidate]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
      {/* Header with Title & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <i className="ri-folder-shield-2-line text-lg" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">Employee Document Portal</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">10.1 & 10.2 Document Status</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-10">Tracked independently: Missing / Uploaded / Under Review / Verified / Rejected</p>
        </div>

        {/* Progress Pill & Breakdown */}
        <div className="sm:text-right shrink-0 space-y-1.5">
          <div className="flex items-center sm:justify-end gap-2 text-xs font-bold text-gray-800 flex-wrap">
            <span>Verified:</span>
            <span className={stats.isAllComplete ? "text-emerald-700 font-extrabold" : "text-blue-700 font-extrabold"}>
              {stats.verifiedRequired} of {stats.totalRequired} Required ({stats.percentage}%)
            </span>
            {missingSlots.length > 0 && (
              <button
                type="button"
                onClick={handleNotifyMissing}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Send In-App & Telegram notification for missing required documents"
              >
                <i className="ri-alarm-warning-line" />
                <span>Alert Missing ({missingSlots.length})</span>
              </button>
            )}
            {!stats.isAllComplete && stats.totalUploaded > 0 && (
              <button
                type="button"
                onClick={handleVerifyAll}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Mark all uploaded documents as Verified"
              >
                <i className="ri-checkbox-circle-line" />
                <span>Verify All</span>
              </button>
            )}
            {stats.totalRejected > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-extrabold">{stats.totalRejected} Rejected</span>
            )}
          </div>
          <div className="w-48 sm:w-56 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60 ml-auto">
            <div className={`h-full transition-all duration-500 ${stats.isAllComplete ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${Math.min(100, stats.percentage)}%` }} />
          </div>
        </div>
      </div>

      {/* Document Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {REQUIRED_DOCUMENT_SLOTS.map((slot) => (
          <DocumentSlotItem
            key={slot.key}
            slot={slot}
            doc={findSlotDocument(slot.key, documents)}
            onUpload={handleSlotUpload}
            onDelete={handleDeleteSlot}
            onUpdateStatus={handleUpdateStatus}
          />
        ))}
      </div>
    </div>
  );
});
