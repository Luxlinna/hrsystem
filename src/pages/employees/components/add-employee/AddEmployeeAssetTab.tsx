import { useState, useCallback, useMemo, memo } from "react";
import type { EmployeeFormState, EmployeeAssetBookingItem, EmployeeAssetAttachment } from "../../types";
import { useAssetCatalogData } from "./asset-tab/useAssetCatalogData";
import { AssetBookingTable } from "./asset-tab/AssetBookingTable";
import { AssetAttachmentSection } from "./asset-tab/AssetAttachmentSection";
import { AssignAssetModal } from "./asset-tab/AssignAssetModal";
import { SelectAssetModal } from "./asset-tab/SelectAssetModal";
import type { AvailableAssetItem } from "./asset-tab/types";

interface AddEmployeeAssetTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches?: Array<{ id: string; name: string; location: string | null }>;
  currentBranch?: { id: string; name: string; location: string | null } | null;
}

export const AddEmployeeAssetTab = memo(function AddEmployeeAssetTab({
  form,
  onChange,
}: AddEmployeeAssetTabProps) {
  const { assets: availableAssets } = useAssetCatalogData(form.branch_id);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [stagedAssets, setStagedAssets] = useState<AvailableAssetItem[]>([]);

  const bookings: EmployeeAssetBookingItem[] = useMemo(
    () => form.asset_bookings || [],
    [form.asset_bookings]
  );
  const attachments: EmployeeAssetAttachment[] = useMemo(
    () => form.asset_attachments || [],
    [form.asset_attachments]
  );

  const handleOpenAssignModal = useCallback(() => {
    setShowAssignModal(true);
  }, []);

  const handleOpenSelectModal = useCallback(() => {
    setShowSelectModal(true);
  }, []);

  const handleAssetsSelected = useCallback((chosen: AvailableAssetItem[]) => {
    setStagedAssets((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newlyAdded = chosen.filter((c) => !existingIds.has(c.id));
      return [...prev, ...newlyAdded];
    });
  }, []);

  const handleRemoveStagedAsset = useCallback((id: string) => {
    setStagedAssets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleRemoveSelectedStagedAssets = useCallback((ids: string[]) => {
    const removeSet = new Set(ids);
    setStagedAssets((prev) => prev.filter((p) => !removeSet.has(p.id)));
  }, []);

  const handleAssignDone = useCallback(
    (newBookings: EmployeeAssetBookingItem[]) => {
      onChange("asset_bookings", [...bookings, ...newBookings]);
      setStagedAssets([]);
    },
    [bookings, onChange]
  );

  const handleRemoveBookings = useCallback(
    (idsToRemove: string[]) => {
      const removeSet = new Set(idsToRemove);
      const updated = bookings.filter((b) => !removeSet.has(b.id));
      onChange("asset_bookings", updated);
    },
    [bookings, onChange]
  );

  const handleAttachmentsChange = useCallback(
    (newAttachments: EmployeeAssetAttachment[]) => {
      onChange("asset_attachments", newAttachments);
    },
    [onChange]
  );

  return (
    <div className="space-y-6 w-full pb-6">
      {/* 1. ASSET BOOKING INFO Table */}
      <AssetBookingTable
        bookings={bookings}
        onAddAsset={handleOpenAssignModal}
        onRemoveSelected={handleRemoveBookings}
      />

      {/* 2. ATTACHMENT INFO */}
      <AssetAttachmentSection
        attachments={attachments}
        onChange={handleAttachmentsChange}
      />

      {/* Modal 1: ASSIGN INFO Modal */}
      <AssignAssetModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setStagedAssets([]);
        }}
        onDone={handleAssignDone}
        onOpenSelectModal={handleOpenSelectModal}
        selectedAssets={stagedAssets}
        onRemoveAsset={handleRemoveStagedAsset}
        onRemoveSelectedAssets={handleRemoveSelectedStagedAssets}
      />

      {/* Modal 2: SELECT ASSET Modal */}
      <SelectAssetModal
        isOpen={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        availableAssets={availableAssets}
        onSelect={handleAssetsSelected}
      />
    </div>
  );
});
