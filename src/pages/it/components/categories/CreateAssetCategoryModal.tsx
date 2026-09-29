import { useState, memo, useEffect, useRef, useCallback } from "react";
import type { AssetCategoryCardConfig } from "../../constants";
import { uploadFileToS3, uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

export interface AssetCategoryFormData {
  name: string;
  type: string;
  manageQuantity: boolean;
  allowRequest: boolean;
  trackSerialNumber: boolean;
  trackWarranty: boolean;
  trackTagging: boolean;
  tag: string;
  serialNumber?: string;
  sellerName?: string;
  invoiceRef?: string;
  imageUrl?: string | null;
  attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
}

interface CreateAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssetCategoryFormData) => void;
  initialData?: AssetCategoryCardConfig | null;
}

const CATEGORY_TYPES = [
  "Electronic Hardware",
  "Office Supply",
  "Furniture",
  "Vehicle & Fleet",
  "Network & Infrastructure",
  "Tools & Machinery",
  "Stationery",
  "Other",
];

export const CreateAssetCategoryModal = memo(function CreateAssetCategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CreateAssetCategoryModalProps) {
  const [formData, setFormData] = useState<AssetCategoryFormData>({
    name: "",
    type: "Electronic Hardware",
    manageQuantity: false,
    allowRequest: false,
    trackSerialNumber: true,
    trackWarranty: false,
    trackTagging: true,
    tag: "",
    serialNumber: "",
    sellerName: "",
    invoiceRef: "",
    imageUrl: null,
    attachments: [],
  });

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [isDocDragOver, setIsDocDragOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        type: initialData.subType || "Electronic Hardware",
        manageQuantity: !!initialData.manageQuantity,
        allowRequest: !!initialData.allowRequest,
        trackSerialNumber: initialData.trackingBadges?.includes("Track Serial Number") || initialData.trackSerialNumber !== false,
        trackWarranty: initialData.trackingBadges?.includes("Track Warranty") || !!initialData.trackWarranty,
        trackTagging: initialData.trackingBadges?.includes("Track Tagging") || initialData.trackTagging !== false,
        tag: initialData.tag || "",
        serialNumber: initialData.serialNumber || "",
        sellerName: initialData.sellerName || "",
        invoiceRef: initialData.invoiceRef || "",
        imageUrl: initialData.imageUrl || null,
        attachments: initialData.attachments || [],
      });
    } else {
      setFormData({
        name: "",
        type: "Electronic Hardware",
        manageQuantity: false,
        allowRequest: false,
        trackSerialNumber: true,
        trackWarranty: false,
        trackTagging: true,
        tag: "",
        serialNumber: "",
        sellerName: "",
        invoiceRef: "",
        imageUrl: null,
        attachments: [],
      });
    }
  }, [initialData, isOpen]);

  // Handle image upload
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadFileToS3(file, "asset-categories/photos");
      setFormData((p) => ({ ...p, imageUrl: res.url }));
      toast("Image Uploaded", "Category photo has been attached.", "success");
    } catch (err) {
      console.warn("Upload fallback:", err);
      const localUrl = URL.createObjectURL(file);
      setFormData((p) => ({ ...p, imageUrl: localUrl }));
      toast("Preview Loaded", "Image preview attached locally.", "success");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle document attachments
  const handleDocFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !fileList.length) return;
      const fileArray = Array.from(fileList);

      setUploadingDocs(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "asset-categories/docs");
        const newItems = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
        }));
        setFormData((p) => ({
          ...p,
          attachments: [...(p.attachments || []), ...newItems],
        }));
        toast("Documents Uploaded", `Added ${fileArray.length} document(s).`, "success");
      } catch (err) {
        console.warn("Doc upload fallback:", err);
        const fallbackItems = fileArray.map((f) => ({
          name: f.name,
          url: URL.createObjectURL(f),
          size: f.size,
          type: f.type,
        }));
        setFormData((p) => ({
          ...p,
          attachments: [...(p.attachments || []), ...fallbackItems],
        }));
        toast("Documents Attached", `Attached ${fileArray.length} document(s).`, "success");
      } finally {
        setUploadingDocs(false);
        if (docInputRef.current) docInputRef.current.value = "";
      }
    },
    []
  );

  const handleRemoveDoc = (url: string) => {
    setFormData((p) => ({
      ...p,
      attachments: (p.attachments || []).filter((a) => a.url !== url),
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
            {initialData ? "EDIT ASSET CATEGORY" : "CREATE ASSET CATEGORY"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Form Body in Standard Uniform 2-Column ERP Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* 1. Name Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Name <span className="text-rose-500">*</span>
            </label>
            <div>
              <input
                type="text"
                required
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* 2. Type Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Type <span className="text-rose-500">*</span>
            </label>
            <div>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] shadow-2xs"
              >
                {CATEGORY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Checkboxes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-4">
            <div className="hidden sm:block" />
            <div className="space-y-3.5 max-w-md">
              {/* Row 1 */}
              <div>
                <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.manageQuantity}
                    onChange={(e) => setFormData((p) => ({ ...p, manageQuantity: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Manage Quantity</span>
                </label>
              </div>

              {/* Row 2: 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.allowRequest}
                    onChange={(e) => setFormData((p) => ({ ...p, allowRequest: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Allow Request</span>
                </label>

                <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.trackSerialNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, trackSerialNumber: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Track Serial Number</span>
                </label>
              </div>

              {/* Row 3: 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.trackWarranty}
                    onChange={(e) => setFormData((p) => ({ ...p, trackWarranty: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Track Warranty</span>
                </label>

                <label className="inline-flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.trackTagging}
                    onChange={(e) => setFormData((p) => ({ ...p, trackTagging: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Track Tagging</span>
                </label>
              </div>
            </div>
          </div>

          {/* 4. Tag Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Tag
            </label>
            <div>
              <input
                type="text"
                placeholder="Tag"
                value={formData.tag}
                onChange={(e) => setFormData((p) => ({ ...p, tag: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* 5. Seller / Vendor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Seller Name
            </label>
            <div>
              <input
                type="text"
                placeholder="Seller / Vendor Name"
                value={formData.sellerName}
                onChange={(e) => setFormData((p) => ({ ...p, sellerName: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* 6. Purchase Invoice / PO Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Invoice / PO Ref
            </label>
            <div>
              <input
                type="text"
                placeholder="Invoice or Purchase Order Ref #"
                value={formData.invoiceRef}
                onChange={(e) => setFormData((p) => ({ ...p, invoiceRef: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* 7. Clean Single Serial Number Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right">
              Serial Number
            </label>
            <div>
              <input
                type="text"
                placeholder="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData((p) => ({ ...p, serialNumber: e.target.value }))}
                className="w-full max-w-md px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white font-mono shadow-2xs"
              />
            </div>
          </div>

          {/* 8. Photo Upload Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right pt-2">
              Photo
            </label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => imageInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border border-dashed border-slate-300 hover:border-[#253C7D] bg-slate-50 hover:bg-[#253C7D]/5 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all shadow-2xs shrink-0"
              >
                {formData.imageUrl ? (
                  <>
                    <img
                      src={formData.imageUrl}
                      alt="Category"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity">
                      <span>Change</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-1">
                    <i className={uploadingImage ? "ri-loader-4-line animate-spin text-[#253C7D] text-base" : "ri-image-add-line text-slate-400 text-base"} />
                    <span className="text-[9px] text-slate-500 block font-medium">
                      {uploadingImage ? "..." : "Upload"}
                    </span>
                  </div>
                )}
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFile}
              />

              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, imageUrl: null }))}
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* 9. Attachment Dropzone Field */}
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-4">
            <label className="text-xs font-semibold text-slate-700 sm:text-right pt-2">
              Attachment
            </label>
            <div className="w-full max-w-md space-y-2">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDocDragOver(true);
                }}
                onDragLeave={() => setIsDocDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDocDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleDocFiles(e.dataTransfer.files);
                  }
                }}
                className={`border border-dashed rounded-md p-3 text-center transition-all bg-white ${
                  isDocDragOver ? "border-[#253C7D] bg-[#253C7D]/5" : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleDocFiles(e.target.files)}
                />

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                  <i className={uploadingDocs ? "ri-loader-4-line animate-spin text-[#253C7D]" : "ri-upload-cloud-line text-slate-400 text-base"} />
                  <span>Drop file here or</span>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    disabled={uploadingDocs}
                    className="font-medium text-[#253C7D] hover:underline cursor-pointer ml-0.5"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Attachment List */}
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="space-y-1.5">
                  {formData.attachments.map((att, idx) => (
                    <div
                      key={att.url || idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <i className="ri-file-text-line text-[#253C7D]" />
                        <span className="truncate font-medium text-slate-700">{att.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-700"
                          title="Open document"
                        >
                          <i className="ri-external-link-line" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(att.url)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Remove"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer buttons matching Screenshot 2 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || uploadingImage || uploadingDocs}
            className="px-5 py-2 rounded-md bg-[#253C7D] hover:bg-[#1E3064] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-save-line" />
            <span>Done</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
});
