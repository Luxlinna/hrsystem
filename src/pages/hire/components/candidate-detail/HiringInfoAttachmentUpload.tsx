import React, { useRef, useState, memo } from "react";
import type { Candidate, CandidateDocument } from "../../types";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface HiringInfoAttachmentUploadProps {
  candidate: Candidate;
  onCandidateUpdated?: (updated: Partial<Candidate>) => void;
}

export const HiringInfoAttachmentUpload: React.FC<HiringInfoAttachmentUploadProps> = memo(
  function HiringInfoAttachmentUpload({ candidate, onCandidateUpdated }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Get documents specifically tagged for hiring info or general attachments
    const hiringDocs = (candidate.documents || []).filter(
      (d: CandidateDocument) => d.doc_slot_key === "hiring_info" || d.stage_key === "hiring"
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (!files.length || !candidate.id) return;

      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(files, "candidates/hiring-info");
        const newDocs: CandidateDocument[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
          doc_slot_key: "hiring_info",
          stage_key: "hiring",
        }));

        const existing = candidate.documents || [];
        const allDocs = [...existing, ...newDocs];

        const { error } = await supabase
          .from("candidates")
          .update({ documents: allDocs })
          .eq("id", candidate.id);

        if (error) throw error;

        onCandidateUpdated?.({ documents: allDocs });
        toast("Files Attached", `Uploaded ${files.length} document(s) to Hiring Record.`, "success");
      } catch (err) {
        console.error("Hiring attachment error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload file", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleDeleteDoc = async (docUrl: string) => {
      if (!candidate.id) return;
      const updatedDocs = (candidate.documents || []).filter((d: CandidateDocument) => d.url !== docUrl);
      const { error } = await supabase.from("candidates").update({ documents: updatedDocs }).eq("id", candidate.id);
      if (!error) {
        onCandidateUpdated?.({ documents: updatedDocs });
        toast("Removed", "File removed from hiring attachments", "info");
      }
    };

    return (
      <div className="space-y-2 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <i className="ri-attachment-2 text-[#253C7D]" />
            <span>Hiring Attachments ({hiringDocs.length})</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-[#253C7D] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Upload signed hiring forms, approvals or supporting attachments"
          >
            <i className={uploading ? "ri-loader-4-line animate-spin" : "ri-upload-cloud-2-line"} />
            <span>{uploading ? "Uploading..." : "Upload File"}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
        </div>

        {hiringDocs.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {hiringDocs.map((doc: CandidateDocument, i: number) => (
              <div
                key={doc.url || i}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium group"
              >
                <i className={doc.name.endsWith(".pdf") ? "ri-file-pdf-fill text-rose-500" : "ri-file-text-line text-[#253C7D]"} />
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-800 hover:text-[#253C7D] truncate max-w-[180px]"
                  title={doc.name}
                >
                  {doc.name}
                </a>
                {doc.size && <span className="text-[10px] text-slate-400">({Math.round(doc.size / 1024)} KB)</span>}
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.url)}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                  title="Remove attachment"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 italic">No files attached to this hiring record yet.</p>
        )}
      </div>
    );
  }
);
