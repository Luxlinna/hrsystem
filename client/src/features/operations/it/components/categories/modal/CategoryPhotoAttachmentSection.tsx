import { memo, useRef, useState, useCallback } from "react";
import type { AssetCategoryFormData } from "../types";
import { uploadFileToS3, uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface CategoryPhotoAttachmentSectionProps {
  formData: AssetCategoryFormData;
  onChange: (updater: (p: AssetCategoryFormData) => AssetCategoryFormData) => void;
  uploadingImage: boolean;
  setUploadingImage: (val: boolean) => void;
  uploadingDocs: boolean;
  setUploadingDocs: (val: boolean) => void;
}

export const CategoryPhotoAttachmentSection = memo(function CategoryPhotoAttachmentSection({
  formData,
  onChange,
  uploadingImage,
  setUploadingImage,
  uploadingDocs,
  setUploadingDocs,
}: CategoryPhotoAttachmentSectionProps) {
  const [isDocDragOver, setIsDocDragOver] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadFileToS3(file, "asset-categories/photos");
      onChange((p) => ({ ...p, imageUrl: res.url }));
      toast("Image Uploaded", "Category photo has been attached.", "success");
    } catch (err) {
      console.warn("Upload fallback:", err);
      const localUrl = URL.createObjectURL(file);
      onChange((p) => ({ ...p, imageUrl: localUrl }));
      toast("Preview Loaded", "Image preview attached locally.", "success");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

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
        onChange((p) => ({
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
        onChange((p) => ({
          ...p,
          attachments: [...(p.attachments || []), ...fallbackItems],
        }));
        toast("Documents Attached", `Attached ${fileArray.length} document(s).`, "success");
      } finally {
        setUploadingDocs(false);
        if (docInputRef.current) docInputRef.current.value = "";
      }
    },
    [onChange, setUploadingDocs]
  );

  const handleRemoveDoc = (url: string) => {
    onChange((p) => ({
      ...p,
      attachments: (p.attachments || []).filter((a) => a.url !== url),
    }));
  };

  return (
    <>
      {/* Photo Upload Field */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1 pt-1.5">
          Photo
        </label>
        <div className="flex items-center gap-3">
          <div
            onClick={() => imageInputRef.current?.click()}
            className="w-16 h-16 rounded border-2 border-dashed border-gray-300 hover:border-[#3498db] bg-gray-50 hover:bg-[#3498db]/5 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all shrink-0"
          >
            {formData.imageUrl ? (
              <>
                <img
                  src={formData.imageUrl}
                  alt="Category"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">
                  <span>Change</span>
                </div>
              </>
            ) : (
              <div className="text-center p-1">
                <i className={uploadingImage ? "ri-loader-4-line animate-spin text-[#3498db] text-base" : "ri-image-add-line text-gray-400 text-base"} />
                <span className="text-[10px] text-gray-500 block font-medium mt-0.5">
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
              onClick={() => onChange((p) => ({ ...p, imageUrl: null }))}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer"
            >
              Remove Photo
            </button>
          )}
        </div>
      </div>

      {/* Attachment Dropzone Field */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1 pt-1.5">
          Attachment
        </label>
        <div className="w-full space-y-2">
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
            className={`border-2 border-dashed rounded p-3 text-center transition-all bg-gray-50/60 ${
              isDocDragOver ? "border-[#3498db] bg-[#3498db]/10" : "border-gray-300 hover:border-[#3498db]"
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

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
              <i className={uploadingDocs ? "ri-loader-4-line animate-spin text-[#3498db] text-base" : "ri-upload-cloud-line text-gray-400 text-base"} />
              <span>Drop file here or</span>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                disabled={uploadingDocs}
                className="font-medium text-[#3498db] hover:underline cursor-pointer ml-0.5"
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
                  className="flex items-center justify-between px-3 py-1.5 rounded bg-white border border-gray-200 text-xs shadow-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <i className="ri-file-text-line text-[#3498db] text-sm" />
                    <span className="truncate font-medium text-gray-800">{att.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-800 p-1"
                      title="Open document"
                    >
                      <i className="ri-external-link-line" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(att.url)}
                      className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
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
    </>
  );
});
