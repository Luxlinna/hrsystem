import { useState, memo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { AssetCategoryCardConfig } from "../../constants";
import { CATEGORY_TYPES, type AssetCategoryFormData } from "./types";
import { CategoryFormBasicFields } from "./modal/CategoryFormBasicFields";
import { CategoryTrackingCheckboxes } from "./modal/CategoryTrackingCheckboxes";
import { CategoryPhotoAttachmentSection } from "./modal/CategoryPhotoAttachmentSection";

export type { AssetCategoryFormData };

interface CreateAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AssetCategoryFormData) => void;
  initialData?: AssetCategoryCardConfig | null;
}

const DEFAULT_FORM_DATA: AssetCategoryFormData = {
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
};

export const CreateAssetCategoryModal = memo(function CreateAssetCategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CreateAssetCategoryModalProps) {
  const [formData, setFormData] = useState<AssetCategoryFormData>(DEFAULT_FORM_DATA);
  const [customType, setCustomType] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  useEffect(() => {
    if (initialData) {
      const isPredefined = CATEGORY_TYPES.includes(initialData.subType || "") && initialData.subType !== "Other";
      setFormData({
        name: initialData.name || "",
        type: isPredefined ? (initialData.subType || "Electronic Hardware") : "Other",
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
      setCustomType(isPredefined ? "" : (initialData.subType === "Other" ? "" : (initialData.subType || "")));
    } else {
      setFormData(DEFAULT_FORM_DATA);
      setCustomType("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const finalType = formData.type === "Other" ? (customType.trim() || "Other") : formData.type;
    onSave({
      ...formData,
      type: finalType,
    });
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-md shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-cover-down">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#3498db] uppercase tracking-wider">
            {initialData ? "EDIT ASSET CATEGORY" : "CREATE ASSET CATEGORY"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Form Body in Standard Uniform 2-Column ERP Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          <CategoryFormBasicFields
            formData={formData}
            customType={customType}
            setCustomType={setCustomType}
            onChange={setFormData}
          />
          <CategoryTrackingCheckboxes
            formData={formData}
            onChange={setFormData}
          />
          <CategoryPhotoAttachmentSection
            formData={formData}
            onChange={setFormData}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
            uploadingDocs={uploadingDocs}
            setUploadingDocs={setUploadingDocs}
          />
        </form>

        {/* Footer buttons */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-end gap-2.5 bg-white">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.name.trim() || uploadingImage || uploadingDocs}
            className="px-4 py-1.5 rounded bg-[#3498db] hover:bg-[#2980b9] disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
          >
            <i className="ri-checkbox-circle-fill text-xs" />
            <span>Done</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
          >
            <i className="ri-close-fill text-xs text-gray-800" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
});
