import React, { useRef, useState } from "react";
import type { Employee, EmployeeNssfInfo } from "../../types";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface NssfAttachmentSectionProps {
  employee: Employee;
  nssf: EmployeeNssfInfo;
  onUpdateAttachments: (attachments: any[]) => void;
}

export const NssfAttachmentSection: React.FC<NssfAttachmentSectionProps> = ({
  employee,
  nssf,
  onUpdateAttachments,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const attachments: any[] = (nssf as any).attachments || [];

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const uploaded = await uploadMultipleFilesToS3(Array.from(files), "employees/nssf-attachments");
      const newItems = uploaded.map((item) => ({
        name: item.name,
        url: item.url,
        size: item.size,
        type: item.type,
        uploaded_at: new Date().toISOString(),
      }));

      const updated = [...attachments, ...newItems];
      const updatedNssf = { ...nssf, attachments: updated };
      const hiringInfo = {
        ...((employee as any).hiring_info || {}),
        nssf_info: updatedNssf,
      };

      await supabase
        .from("employees")
        .update({ hiring_info: hiringInfo })
        .eq("id", employee.id);

      onUpdateAttachments(updated);
      toast("Stored to AWS S3", `Uploaded ${files.length} document(s).`, "success");
    } catch (err: any) {
      toast("Upload Failed", err.message || "Failed to upload document", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (idx: number) => {
    const updated = attachments.filter((_, i) => i !== idx);
    const updatedNssf = { ...nssf, attachments: updated };
    const hiringInfo = {
      ...((employee as any).hiring_info || {}),
      nssf_info: updatedNssf,
    };

    await supabase
      .from("employees")
      .update({ hiring_info: hiringInfo })
      .eq("id", employee.id);

    onUpdateAttachments(updated);
    toast("Attachment Removed", "Document removed from NSSF records.", "info");
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="pt-5 border-t border-slate-100 space-y-3">
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
        ATTACHMENT INFO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3 text-xs items-start">
        <div className="md:col-span-3 text-slate-500 font-medium pt-1">
          Attachment
        </div>

        <div className="md:col-span-9 space-y-3">
          {/* Dropzone with AWS S3 integration */}
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border border-dashed border-slate-300 hover:border-[#253C7D] rounded-lg p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <span className="text-xs text-slate-600">
              {uploading ? (
                <span className="text-[#253C7D] font-bold animate-pulse">
                  Uploading to AWS S3...
                </span>
              ) : (
                <>
                  <i className="ri-upload-cloud-line text-slate-400 mr-1.5" />
                  Drop file here or{" "}
                  <span className="text-blue-600 underline font-semibold">Browse</span>
                </>
              )}
            </span>
          </div>

          {/* Uploaded File List matching user screenshot */}
          {attachments.length > 0 && (
            <div className="space-y-2.5">
              {attachments.map((file, idx) => (
                <div key={idx} className="space-y-1 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="ri-file-text-line text-slate-700 text-sm shrink-0" />
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-medium text-slate-800 hover:text-blue-600 hover:underline"
                        >
                          {file.name}
                        </a>
                      ) : (
                        <span className="truncate font-medium text-slate-800">
                          {file.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 text-[11px]">
                        {formatSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer text-xs"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* Green progress/accent indicator bar matching screenshot */}
                  <div className="h-1 w-full bg-emerald-600 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
