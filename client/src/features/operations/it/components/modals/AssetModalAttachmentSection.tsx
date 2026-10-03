import React, { useRef } from "react";

interface AssetModalAttachmentSectionProps {
  photoUrl?: string | null;
  attachmentName?: string | null;
  uploadingPhoto: boolean;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

export const AssetModalAttachmentSection: React.FC<AssetModalAttachmentSectionProps> = ({
  photoUrl,
  attachmentName,
  uploadingPhoto,
  onPhotoSelect,
  onRemovePhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="pt-3 border-t border-slate-200">
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
          ATTACHMENT INFO
        </h3>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onPhotoSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="px-3 py-1.5 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {uploadingPhoto ? (
              <i className="ri-loader-4-line text-xs animate-spin text-[#253C7D]" />
            ) : (
              <i className="ri-attachment-line text-xs text-slate-500" />
            )}
            <span>Photo</span>
          </button>
        </div>

        {photoUrl && (
          <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 max-w-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xs bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {photoUrl.match(/\.(jpg|jpeg|png|webp)$/i) || !photoUrl.includes(".pdf") ? (
                  <img
                    src={photoUrl}
                    alt="Asset Attachment"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="ri-file-pdf-line text-xl text-rose-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {attachmentName || "Asset Photo"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                  <i className="ri-cloud-line" />
                  <span>AWS S3</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-[#253C7D] rounded transition-colors"
                title="View Full Photo"
              >
                <i className="ri-external-link-line text-xs" />
              </a>
              <button
                type="button"
                onClick={onRemovePhoto}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                title="Remove Photo"
              >
                <i className="ri-delete-bin-line text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


