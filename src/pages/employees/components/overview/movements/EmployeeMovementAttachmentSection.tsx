import { memo, useState, useRef, useCallback } from "react";
import type { Employee } from "../../../types";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

export interface MovementAttachmentItem {
  id: string;
  name: string;
  url: string;
  sizeText: string;
  uploadedAt?: string;
}

interface Props {
  employee: Employee;
  initialAttachments?: MovementAttachmentItem[];
}

export const EmployeeMovementAttachmentSection = memo(function EmployeeMovementAttachmentSection({
  employee,
  initialAttachments = [],
}: Props) {
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const [attachments, setAttachments] = useState<MovementAttachmentItem[]>(() => {
    if (initialAttachments.length > 0) return initialAttachments;
    const existing = (employee.documents || [])
      .filter((d: any) => d && (d.doc_slot_key === "movement_attachment" || d.url?.includes("movements")))
      .map((d: any, i: number) => ({
        id: `db-att-${i}`,
        name: d.name || "Movement Document",
        url: d.url,
        sizeText: d.size ? formatFileSize(d.size) : "—",
        uploadedAt: d.uploaded_at,
      }));

    if (existing.length > 0) return existing;
    const namePrefix = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
    return [
      { id: "att-1", name: `3461_${namePrefix}_pass probation_15102024.pdf`, url: "#", sizeText: "970 KB" },
      { id: "att-2", name: `${namePrefix}_Transfer_08102025.pdf`, url: "#", sizeText: "263 KB" },
    ];
  });

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const s3 = await uploadFileToS3(file, `employees/${employee.id}/movements`);
        const item: MovementAttachmentItem = {
          id: `att-${Date.now()}`,
          name: file.name,
          url: s3.url,
          sizeText: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
        };
        setAttachments((prev) => [...prev, item]);

        const currentDocs = Array.isArray(employee.documents) ? employee.documents : [];
        await supabase.from("employees").update({
          documents: [
            ...currentDocs,
            {
              name: `Movement Attachment (${file.name})`,
              url: s3.url,
              size: s3.size,
              type: s3.type || file.type || "application/pdf",
              uploaded_at: new Date().toISOString(),
              doc_slot_key: "movement_attachment",
              verification_status: "verified",
            },
          ],
        }).eq("id", employee.id);

        toast("Saved to AWS S3", `${file.name} uploaded successfully.`, "success");
      } catch (err: any) {
        toast("AWS S3 Upload Error", err.message || "Failed to upload to AWS", "error");
      } finally {
        setUploading(false);
      }
    },
    [employee.id, employee.documents]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDeleteAttachment = async (id: string) => {
    const target = attachments.find((a) => a.id !== id);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    if (target && target.url && !target.url.startsWith("#")) {
      const remaining = (employee.documents || []).filter((d: any) => d.url !== target.url);
      await supabase.from("employees").update({ documents: remaining }).eq("id", employee.id);
    }
  };

  return (
    <div className="mt-8 pt-5 border-t border-gray-200 dark:border-slate-800">
      <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-4">
        ATTACHMENT INFO
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start text-xs">
        <label className="sm:col-span-2 text-gray-700 dark:text-slate-300 font-medium pt-2">
          Attachment
        </label>

        <div className="sm:col-span-10 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                : "border-gray-300 dark:border-slate-700 hover:border-gray-400 bg-gray-50/40 dark:bg-slate-800/40"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-slate-400">
              <i className="ri-cloud-upload-line text-sm" />
              <span>Drop file here or</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                Browse
              </span>
            </div>
            {uploading && (
              <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 animate-pulse font-medium">
                Uploading to AWS S3...
              </p>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3">
                <div className="shrink-0 text-gray-700 dark:text-slate-300">
                  <i className="ri-file-pdf-2-line text-xl text-rose-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 text-xs mb-1">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-gray-800 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 truncate"
                      title={att.name}
                    >
                      {att.name}
                    </a>
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 shrink-0 font-medium">
                      {att.sizeText}
                    </span>
                  </div>

                  <div className="w-full h-1 bg-emerald-500 rounded-full" />
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(att.id)}
                  className="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs px-1 cursor-pointer font-bold shrink-0"
                  title="Remove attachment"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
