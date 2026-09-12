import { memo, useState, useEffect, useCallback } from "react";
import type { Employee } from "../../types";
import { REQUIRED_DOCUMENT_SLOTS, findSlotDocument } from "@/pages/hire/constants/documentPortalConfig";
import { DOCUMENT_STATUS_CONFIG, getDocumentVerificationStatus } from "@/pages/hire/constants/documentStatusConfig";
import { supabase } from "@/lib/supabase";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface EmployeeDocumentsCardProps {
  employee: Employee;
}

export const EmployeeDocumentsCard = memo(function EmployeeDocumentsCard({
  employee,
}: EmployeeDocumentsCardProps) {
  const [documents, setDocuments] = useState<any[]>(employee.documents || []);
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  useEffect(() => {
    if (employee.documents && employee.documents.length > 0) {
      setDocuments(employee.documents);
      return;
    }

    const loadCandidateDocs = async () => {
      setLoading(true);
      try {
        let query = supabase.from("candidates").select("documents");
        if (employee.candidate_id) query = query.eq("id", employee.candidate_id);
        else if (employee.email) query = query.eq("email", employee.email);
        else return;

        const { data, error } = await query.maybeSingle();
        if (!error && data?.documents && Array.isArray(data.documents)) setDocuments(data.documents);
      } catch (err) {
        console.error("Failed to load employee documents:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCandidateDocs();
  }, [employee.candidate_id, employee.email, employee.documents]);

  const handleUpload = useCallback(
    async (slotKey: string, slotTitle: string, file: File) => {
      setUploadingSlot(slotKey);
      try {
        const s3Item = await uploadFileToS3(file, `employees/${employee.id}/documents/${slotKey}`);

        const newDoc = {
          name: `${slotTitle} (${file.name})`,
          url: s3Item.url,
          size: s3Item.size,
          type: s3Item.type || file.type || "application/pdf",
          uploaded_at: new Date().toISOString(),
          doc_slot_key: slotKey,
          verification_status: "uploaded",
        };

        const updated = [...documents.filter((d) => d.doc_slot_key !== slotKey), newDoc];
        setDocuments(updated);
        await supabase.from("employees").update({ documents: updated }).eq("id", employee.id);
        toast("Document Saved", `${slotTitle} uploaded to AWS S3.`, "success");
      } catch (err: any) {
        toast("Upload Failed", err.message || "Could not upload document", "error");
      } finally {
        setUploadingSlot(null);
      }
    },
    [documents, employee.id]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#253C7D]">
            <i className="ri-folder-user-line text-lg" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A]">Employee Documents & Compliance</h2>
            <p className="text-[12px] text-gray-500">10.1 Required identification, certificates, and compliance records</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {documents.length} Records
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-xs">Loading employee documents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REQUIRED_DOCUMENT_SLOTS.map((slot) => {
            const doc = findSlotDocument(slot.key, documents);
            const isBusy = uploadingSlot === slot.key;
            const status = getDocumentVerificationStatus(doc);
            const statusMeta = DOCUMENT_STATUS_CONFIG[status];

            return (
              <div
                key={slot.key}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  doc ? "bg-[#FAFBFD] border-gray-100" : "bg-white border-dashed border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${doc ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    <i className={doc ? "ri-checkbox-circle-fill text-sm" : slot.icon} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{slot.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${statusMeta.badgeBg}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">
                      {status === "rejected" && doc?.rejection_reason ? `Rejected: ${doc.rejection_reason}` : doc ? doc.name : slot.required ? "Required" : "Optional"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {doc && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-[#253C7D] hover:bg-gray-100 rounded-md" title="View">
                      <i className="ri-external-link-line text-xs" />
                    </a>
                  )}
                  <label className={`p-1.5 rounded-md text-xs cursor-pointer ${doc ? "text-gray-400 hover:text-gray-600 hover:bg-gray-100" : "text-[#253C7D] bg-blue-50 hover:bg-blue-100 font-medium px-2 py-1"}`}>
                    {isBusy ? <i className="ri-loader-4-line animate-spin" /> : doc ? <i className="ri-upload-2-line" title="Replace file" /> : <span>Upload</span>}
                    <input
                      type="file"
                      className="hidden"
                      accept={slot.accept}
                      disabled={isBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(slot.key, slot.title, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
