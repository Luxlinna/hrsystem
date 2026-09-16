import React, { useState, useRef, useCallback, memo } from "react";
import type { ITAsset, AssetFormState, Employee, Branch } from "../../types";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "../../constants";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          {/* 1. Asset Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Asset Category <span className="text-rose-500">*</span>
            </label>
            <div className="sm:col-span-8">
              <select
                required
                value={assetForm.category || assetForm.type || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssetForm((prev) => ({
                    ...prev,
                    category: val,
                    type: val,
                  }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
              >
                <option value="">Select</option>
                {ASSET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Name <span className="text-rose-500">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                type="text"
                required
                value={assetForm.name}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs"
              />
            </div>
          </div>

          {/* 3. Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Purchase Date <span className="text-rose-500">*</span>
            </label>
            <div className="sm:col-span-8 relative">
              <input
                type="date"
                required
                value={assetForm.purchase_date || ""}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs"
              />
            </div>
          </div>

          {/* 4. Description */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4 sm:pt-2">
              Description
            </label>
            <div className="sm:col-span-8">
              <textarea
                rows={3}
                value={assetForm.description || ""}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] shadow-2xs resize-y"
              />
            </div>
          </div>

          {/* 5. Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Condition <span className="text-rose-500">*</span>
            </label>
            <div className="sm:col-span-8">
              <select
                required
                value={assetForm.condition || "New"}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, condition: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
              >
                <option value="">Select</option>
                {ASSET_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Price */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Price
            </label>
            <div className="sm:col-span-8 flex rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-[#253C7D]">
              <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs uppercase border-r border-slate-200 select-none flex items-center">
                USD
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={assetForm.price ?? 0}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0"
                className="flex-1 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* 7. Site with BU Lock */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <label className="sm:col-span-4 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
              Site <span className="text-rose-500">*</span>
            </label>
            <div className="sm:col-span-8">
              {activeBranchName ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs font-black text-slate-900 flex items-center justify-between shadow-2xs">
                    <span className="flex items-center gap-2 text-[#253C7D]">
                      <i className="ri-building-2-fill text-emerald-600 text-sm" />
                      <span>{activeBranchName}</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active BU
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    required
                    value={assetForm.branch_id || assetForm.site || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedBranch = branches.find((b) => b.id === val || b.name === val);
                      setAssetForm((prev) => ({
                        ...prev,
                        branch_id: matchedBranch ? matchedBranch.id : val,
                        site: matchedBranch ? matchedBranch.name : val,
                      }));
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
                  >
                    <option value="">Select</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleRefreshSites}
                    disabled={refreshingSites}
                    title="Refresh Work Sites / Branches"
                    className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    <i className={`ri-refresh-line text-base ${refreshingSites ? "animate-spin text-[#253C7D]" : ""}`} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-slate-100">
            {/* ATTACHMENT INFO SECTION */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
                ATTACHMENT INFO
              </h3>

              {/* Photo Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <i className="ri-loader-4-line text-sm animate-spin text-[#253C7D]" />
                  ) : (
                    <i className="ri-attachment-line text-sm text-slate-500" />
                  )}
                  <span>Photo</span>
                </button>
              </div>

              {/* Uploaded Photo Preview */}
              {assetForm.photo_url && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-2xs max-w-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {assetForm.photo_url.match(/\.(jpg|jpeg|png|webp)$/i) || !assetForm.photo_url.includes(".pdf") ? (
                        <img
                          src={assetForm.photo_url}
                          alt="Asset Attachment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className="ri-file-pdf-line text-2xl text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {assetForm.attachments?.[0]?.name || "Asset Handover Photo"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold mt-0.5">
                        <i className="ri-cloud-line" />
                        <span>Stored on AWS S3</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={assetForm.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-[#253C7D] rounded-lg transition-colors"
                      title="View Full Photo"
                    >
                      <i className="ri-external-link-line text-sm" />
                    </a>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
