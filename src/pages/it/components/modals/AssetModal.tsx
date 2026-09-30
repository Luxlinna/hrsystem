import React, { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import type { ITAsset, AssetFormState, Employee, Branch } from "../../types";
import { supabase } from "@/lib/supabase";
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
  const [workSites, setWorkSites] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);

  const fetchWorkSites = useCallback(async (branchId?: string | null) => {
    setRefreshingSites(true);
    try {
      let query = supabase
        .from("work_locations")
        .select("id, name, branch_id")
        .is("deleted_at", null)
        .order("name");

      if (branchId && branchId !== "all") {
        query = query.eq("branch_id", branchId);
      }

      const { data } = await query;
      setWorkSites(data || []);
    } catch (err) {
      console.error("Failed to load work sites:", err);
    } finally {
      setRefreshingSites(false);
    }
  }, []);

  // Initialize branch and fetch work sites when opening modal
  useEffect(() => {
    if (isOpen) {
      const initialBranchId =
        assetForm.branch_id ||
        activeBranchId ||
        (activeBranchName ? branches.find((b) => b.name === activeBranchName)?.id : branches[0]?.id) ||
        "";

      if (!assetForm.branch_id && initialBranchId) {
        const branchObj = branches.find((b) => b.id === initialBranchId);
        setAssetForm((prev) => ({
          ...prev,
          branch_id: initialBranchId,
          site: prev.site || branchObj?.name || "Main Office",
        }));
      }

      fetchWorkSites(initialBranchId);
    }
  }, [isOpen, activeBranchId, activeBranchName, branches, assetForm.branch_id, fetchWorkSites, setAssetForm]);

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

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-md shadow-2xl border border-gray-200 overflow-hidden animate-cover-down">
        {/* Form Header matching Screenshot */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xs font-bold text-[#3498db] uppercase tracking-wider">
            {editingAsset ? "EDIT ASSET INVENTORY" : "CREATE ASSET INVENTORY"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto bg-white">
          <AssetModalFormFields
            assetForm={assetForm}
            setAssetForm={setAssetForm}
            branches={branches}
            workSites={workSites}
            activeBranchName={activeBranchName}
            onRefreshSites={() => fetchWorkSites(assetForm.branch_id)}
            refreshingSites={refreshingSites}
          />

          <AssetModalAttachmentSection
            photoUrl={assetForm.photo_url}
            attachmentName={assetForm.attachments?.[0]?.name}
            uploadingPhoto={uploadingPhoto}
            onPhotoSelect={handlePhotoSelect}
            onRemovePhoto={handleRemovePhoto}
          />

          {/* Footer Buttons matching Screenshot */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-none disabled:opacity-50"
            >
              {saving ? (
                <i className="ri-loader-4-line text-xs animate-spin" />
              ) : (
                <i className="ri-checkbox-circle-fill text-xs" />
              )}
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-none"
            >
              <i className="ri-close-fill text-xs text-gray-800" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
});

