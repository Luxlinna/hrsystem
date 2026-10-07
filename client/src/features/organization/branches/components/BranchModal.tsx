import React, { memo, useState } from "react";
import type { BranchFormState } from "../types";
import { BranchScheduleTab } from "./modal/BranchScheduleTab";
import { CompanyInfoSection } from "./profile/CompanyInfoSection";
import { PhysicalAddressSection } from "./profile/PhysicalAddressSection";
import { ContactAndTimezoneSection } from "./profile/ContactAndTimezoneSection";
import { LegalInfoSection } from "./profile/LegalInfoSection";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { optimizeLogoImage } from "@/features/system-admin/settings/components/brandingImageUtils";
import { toast } from "@/components/Toast";

interface BranchModalProps {
  isOpen: boolean;
  initialTab?: "profile" | "schedule";
  editingBranchId: string | null;
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
  addressLookup: string;
  setAddressLookup: (addr: string) => void;
  addressInputRef: React.RefObject<HTMLInputElement | null>;
  locating: boolean;
  geocoding: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onUseCurrentLocation: () => void;
  onGeocodeAddress: () => void;
}

export const BranchModal = memo(function BranchModal({
  isOpen,
  initialTab = "profile",
  editingBranchId,
  form,
  setForm,
  addressLookup,
  setAddressLookup,
  addressInputRef,
  locating,
  geocoding,
  submitting,
  onClose,
  onSubmit,
  onUseCurrentLocation,
  onGeocodeAddress,
}: BranchModalProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "schedule">(initialTab);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "profile");
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleUploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Invalid File", "Please select an image file.", "error");
      return;
    }
    setUploadingLogo(true);
    try {
      const s3Item = await uploadFileToS3(file, "branches/logos");
      setForm((prev) => ({ ...prev, logo_url: s3Item.url }));
      toast("Logo Uploaded", "Logo saved securely to AWS S3.", "success");
    } catch {
      try {
        const optimized = await optimizeLogoImage(file, 600);
        setForm((prev) => ({ ...prev, logo_url: optimized }));
        toast("Logo Uploaded", "Logo saved to company profile.", "success");
      } catch (err) {
        toast("Upload Failed", err instanceof Error ? err.message : "Failed to upload logo", "error");
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl my-0 sm:my-0 max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl border border-gray-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900 dark:text-slate-100">
              {editingBranchId ? "Edit Business Unit & Company Profile" : "Add New Business Unit (BU)"}
            </h2>
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">
              {editingBranchId
                ? "Update official company info, addresses, and operational settings"
                : "Create a new Business Unit location and company profile"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-3 sm:px-6 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "profile", label: "Company Profile", icon: "ri-building-line" },
              { id: "schedule", label: "Work Schedule", icon: "ri-time-line" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.id
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800"
              }`}
            >
              <i className={`${t.icon} text-sm`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <CompanyInfoSection
                form={form}
                setForm={setForm}
                uploadingLogo={uploadingLogo}
                onUploadLogo={handleUploadLogo}
                branchId={editingBranchId || undefined}
                branchName={form.company_name || form.name}
              />
              <PhysicalAddressSection form={form} setForm={setForm} />
              <ContactAndTimezoneSection form={form} setForm={setForm} />
              <LegalInfoSection form={form} setForm={setForm} />
            </div>
          )}

          {activeTab === "schedule" && (
            <BranchScheduleTab form={form} setForm={setForm} />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-5 border-t border-gray-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-[13px] font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-2xs"
          >
            {submitting ? "Saving..." : editingBranchId ? "Save Changes" : "Create BU"}
          </button>
        </div>
      </form>
    </div>
  );
});
