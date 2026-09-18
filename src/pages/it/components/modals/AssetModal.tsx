import React, { useState, memo } from "react";
import type { ITAsset, AssetFormState, Employee, Branch } from "../../types";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import { AssetModalFormFields } from "./AssetModalFormFields";
import { AssetModalAttachmentSection } from "./AssetModalAttachmentSection";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAsset: ITAsset | null;
  assetForm: AssetFormState;
  setAssetForm: React.Dispatch<React.SetStateAction<AssetFormState>>;
  saving: boolean;
  employees: Employee[];
  branches: Branch[];
  activeBranchId?: string | null;
  activeBranchName?: string | null;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onRefreshSites?: () => void;
}

export const AssetModal = memo(function AssetModal({
  isOpen,
  onClose,
  editingAsset,
  assetForm,
  setAssetForm,
  saving,
  branches,
  activeBranchId,
  activeBranchName,
  onSubmit,
  onRefreshSites,
}: AssetModalProps) {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [refreshingSites, setRefreshingSites] = useState(false);

  // Automatically enforce active BU when operating inside a specific Business Unit
  React.useEffect(() => {
    if (isOpen && activeBranchName) {
      setAssetForm((prev) => {
        const targetId = activeBranchId || branches.find((b) => b.name === activeBranchName)?.id || prev.branch_id;
        if (prev.site !== activeBranchName || prev.branch_id !== targetId) {
          return {
            ...prev,
            site: activeBranchName,
            branch_id: targetId || "",
          };
        }
        return prev;
      });
    }
  }, [isOpen, activeBranchId, activeBranchName, branches, setAssetForm]);

  // Handle Photo Upload directly to AWS S3
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const s3Item = await uploadFileToS3(file, "assets/inventory-photos");
      setAssetForm((prev) => ({
        ...prev,
        photo_url: s3Item.url,
        attachments: [
          ...(prev.attachments || []),
          {
            name: s3Item.name,
            url: s3Item.url,
            size: s3Item.size,
            type: s3Item.type,
            key: s3Item.key,
          },
        ],
      }));
      toast("Photo Uploaded", "Asset photo saved to AWS S3.", "success");
    } catch (err) {
      console.error("Asset photo upload failed:", err);
      toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload photo to AWS S3", "error");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setAssetForm((prev) => ({
      ...prev,
      photo_url: null,
      attachments: [],
    }));
  };

  const handleRefreshSites = async () => {
    if (onRefreshSites) {
      setRefreshingSites(true);
      try {
        await onRefreshSites();
        toast("Sites Refreshed", "Work site list synchronized.", "info");
      } finally {
        setTimeout(() => setRefreshingSites(false), 500);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Form Header matching ERP design */}
        <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-sm font-black text-[#253C7D] uppercase tracking-wide">
            {editingAsset ? "EDIT ASSET INVENTORY" : "CREATE ASSET INVENTORY"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          <AssetModalFormFields
            assetForm={assetForm}
            setAssetForm={setAssetForm}
            branches={branches}
            activeBranchName={activeBranchName}
            onRefreshSites={handleRefreshSites}
            refreshingSites={refreshingSites}
          />

          <AssetModalAttachmentSection
            photoUrl={assetForm.photo_url}
            attachmentName={assetForm.attachments?.[0]?.name}
            uploadingPhoto={uploadingPhoto}
            onPhotoSelect={handlePhotoSelect}
            onRemovePhoto={handleRemovePhoto}
          />

          {/* Footer Buttons: Save and Discard */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <i className="ri-loader-4-line text-sm animate-spin" />
              ) : (
                <i className="ri-save-line text-sm" />
              )}
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
