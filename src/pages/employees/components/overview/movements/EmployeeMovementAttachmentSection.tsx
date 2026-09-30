import { memo, useState, useRef, useCallback, useMemo } from "react";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/pages/movements/types";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { MovementAttachmentItem } from "./movementAttachmentTypes";
import { AttachmentItemRow } from "./AttachmentItemRow";

export type { MovementAttachmentItem };

interface Props {
  employee: Employee;
  movements?: EmployeeMovement[];
  initialAttachments?: MovementAttachmentItem[];
  categoryKey?: string;
}

export const EmployeeMovementAttachmentSection = memo(function EmployeeMovementAttachmentSection({
  employee,
  movements = [],
  initialAttachments = [],
  categoryKey = "general",
}: Props) {
  const employeeId = employee.id;
  const employeeDocs = employee.documents;
  const employeeAssetAttachments = (employee as any).asset_attachments;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Attachment";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const [localAdded, setLocalAdded] = useState<MovementAttachmentItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Derive all server attachments purely with useMemo (no unstable useEffect loops)
  const attachments = useMemo(() => {
    const items: MovementAttachmentItem[] = [];
    const seenUrls = new Set<string>();

    // Include any locally added files
    localAdded.forEach((item) => {
      if (item.url && !seenUrls.has(item.url) && !deletedIds.has(item.id)) {
        seenUrls.add(item.url);
        items.push(item);
      }
    });

    // 1. Initial attachments (if passed)
    if (Array.isArray(initialAttachments) && initialAttachments.length > 0) {
      initialAttachments.forEach((item) => {
        if (item.url && !seenUrls.has(item.url) && !deletedIds.has(item.id)) {
          seenUrls.add(item.url);
          items.push(item);
        }
      });
    }

    // 2. Movement records with documents
    (movements || []).forEach((m) => {
      const id = `mov-doc-${m.id}`;
      if (m.document_url && !seenUrls.has(m.document_url) && !deletedIds.has(id)) {
        seenUrls.add(m.document_url);
        items.push({
          id,
          name: m.document_name || `${m.title || "Movement"} Document.pdf`,
          url: m.document_url,
          sizeText: "Attachment",
          uploadedAt: m.created_at,
        });
      }
    });

    // 3. Employee documents array
    (employeeDocs || []).forEach((d: any, i: number) => {
      const url = d?.url || d?.file_url;
      const id = `emp-doc-${i}-${d.id || i}`;
      if (url && !seenUrls.has(url) && !deletedIds.has(id)) {
        seenUrls.add(url);
        items.push({
          id,
          name: d.name || "Document.pdf",
          url: url,
          sizeText: d.size ? formatFileSize(d.size) : "Attachment",
          uploadedAt: d.uploaded_at,
        });
      }
    });

    // 4. Asset attachments array
    if (Array.isArray(employeeAssetAttachments)) {
      employeeAssetAttachments.forEach((att: any, i: number) => {
        const url = att?.url || att?.file_url;
        const id = `asset-att-${i}-${att.id || i}`;
        if (url && !seenUrls.has(url) && !deletedIds.has(id)) {
          seenUrls.add(url);
          items.push({
            id,
            name: att.name || "Asset Document.pdf",
            url: url,
            sizeText: att.size ? formatFileSize(att.size) : "Attachment",
            uploadedAt: att.uploaded_at,
          });
        }
      });
    }

    return items;
  }, [localAdded, deletedIds, initialAttachments, movements, employeeDocs, employeeAssetAttachments]);

  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const folder = `employees/${employeeId}/documents`;
        const s3 = await uploadFileToS3(file, folder);
        const item: MovementAttachmentItem = {
          id: `att-${Date.now()}`,
          name: file.name,
          url: s3.url,
          sizeText: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
        };

        setLocalAdded((prev) => [...prev, item]);

        const currentDocs = Array.isArray(employeeDocs) ? employeeDocs : [];
        const newDocEntry = {
          name: file.name,
          url: s3.url,
          size: s3.size,
          type: s3.type || file.type || "application/pdf",
          uploaded_at: new Date().toISOString(),
          doc_slot_key: `${categoryKey}_attachment`,
          category: categoryKey,
          verification_status: "verified",
        };

        const updatePayload: Record<string, any> = {
          documents: [...currentDocs, newDocEntry],
        };

        if (categoryKey === "asset") {
          const currentAssetAtts = Array.isArray(employeeAssetAttachments)
            ? employeeAssetAttachments
            : [];
          updatePayload.asset_attachments = [
            ...currentAssetAtts,
            {
              name: file.name,
              url: s3.url,
              size: s3.size,
              type: s3.type || file.type || "application/pdf",
            },
          ];
        }

        await supabase.from("employees").update(updatePayload).eq("id", employeeId);

        toast("Saved to AWS S3", `${file.name} uploaded successfully.`, "success");
      } catch (err: any) {
        toast("AWS S3 Upload Error", err.message || "Failed to upload to AWS", "error");
      } finally {
        setUploading(false);
      }
    },
    [employeeId, employeeDocs, employeeAssetAttachments, categoryKey]
  );

  const handleDeleteAttachment = async (id: string) => {
    const target = attachments.find((a) => a.id === id);
    setDeletedIds((prev) => new Set(prev).add(id));

    if (target && target.url && !target.url.startsWith("#")) {
      const remainingDocs = (employeeDocs || []).filter((d: any) => d.url !== target.url && d.file_url !== target.url);
      const updatePayload: Record<string, any> = { documents: remainingDocs };

      if (Array.isArray(employeeAssetAttachments)) {
        updatePayload.asset_attachments = employeeAssetAttachments.filter(
          (a: any) => a.url !== target.url && a.file_url !== target.url
        );
      }

      await supabase.from("employees").update(updatePayload).eq("id", employeeId);
    }
  };

  return (
    <div className="mt-8 pt-5 border-t border-gray-200 dark:border-slate-800">
      <h4 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-4">
        ATTACHMENT INFO
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start text-[13px]">
        <label className="sm:col-span-2 text-gray-700 dark:text-slate-300 font-medium pt-2">
          Attachment
        </label>

        <div className="sm:col-span-10 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleUploadFile(f);
            }}
            className={`border border-dashed rounded py-2 px-4 text-center transition-colors flex items-center justify-center gap-1.5 ${
              isDragging
                ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400"
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

            <i className="ri-upload-cloud-2-line text-sm text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300 text-[13px]">
              Drop file here or{" "}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Browse"}
              </button>
            </span>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              {attachments.map((item) => (
                <AttachmentItemRow
                  key={item.id}
                  item={item}
                  onDelete={() => handleDeleteAttachment(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
