import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { ITAsset, AssetFormState } from "../types";
import { INITIAL_ASSET_FORM } from "../constants";

interface UseAssetMutationsProps {
  canManage: boolean;
  actorName: string;
  actorRole: string;
  targetBranch?: string | null;
  loadData: () => Promise<void>;
}

export function useAssetMutations({
  canManage,
  actorName,
  actorRole,
  targetBranch,
  loadData,
}: UseAssetMutationsProps) {
  const [assetModal, setAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ITAsset | null>(null);
  const [savingAsset, setSavingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState<AssetFormState>(INITIAL_ASSET_FORM);

  const handleCreateAsset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assetForm.name || !assetForm.asset_tag || !canManage || savingAsset) return;
      setSavingAsset(true);

      const resolvedBranch = targetBranch || assetForm.branch_id || null;

      const { error } = await supabase.from("it_assets").insert([
        {
          name: assetForm.name,
          asset_tag: assetForm.asset_tag,
          type: assetForm.type,
          serial_number: assetForm.serial_number || null,
          branch_id: resolvedBranch,
          employee_id: assetForm.employee_id || null,
          status: assetForm.employee_id ? "active" : assetForm.status || "inventory",
        },
      ]);

      setSavingAsset(false);
      if (error) {
        toast("Error", "Failed to register asset", "error");
        return;
      }

      setAssetModal(false);
      setAssetForm(INITIAL_ASSET_FORM);
      toast("Asset Registered", `Added ${assetForm.name} (${assetForm.asset_tag}) to hardware register.`, "success");
      logActivity({
        module: "it",
        action: "created",
        entityType: "it_asset",
        actorName,
        actorRole,
        description: `Registered new IT asset "${assetForm.name}" (${assetForm.asset_tag})`,
      });
      loadData();
    },
    [assetForm, canManage, savingAsset, targetBranch, actorName, actorRole, loadData]
  );

  const openEditAsset = useCallback(
    (asset: ITAsset) => {
      if (!canManage) return;
      setAssetForm({
        name: asset.name,
        asset_tag: asset.asset_tag,
        type: asset.type,
        serial_number: asset.serial_number || "",
        branch_id: asset.branch_id || targetBranch || "",
        employee_id: asset.employee_id || "",
        status: asset.status || "active",
      });
      setEditingAsset(asset);
      setAssetModal(true);
    },
    [canManage, targetBranch]
  );

  const handleSaveAssetEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingAsset || !canManage || savingAsset) return;
      setSavingAsset(true);

      const resolvedBranch = targetBranch || assetForm.branch_id || null;

      const { error } = await supabase
        .from("it_assets")
        .update({
          name: assetForm.name,
          asset_tag: assetForm.asset_tag,
          type: assetForm.type,
          serial_number: assetForm.serial_number || null,
          branch_id: resolvedBranch,
          employee_id: assetForm.employee_id || null,
          status: assetForm.status,
        })
        .eq("id", editingAsset.id);

      setSavingAsset(false);
      if (error) {
        toast("Error", "Failed to update asset", "error");
        return;
      }

      setEditingAsset(null);
      setAssetModal(false);
      toast("Asset Updated", "Asset record details updated.", "success");
      logActivity({
        module: "it",
        action: "updated",
        entityType: "it_asset",
        entityId: editingAsset.id,
        actorName,
        actorRole,
        description: `Updated IT asset "${assetForm.name}" (${assetForm.asset_tag})`,
      });
      loadData();
    },
    [editingAsset, canManage, savingAsset, assetForm, targetBranch, actorName, actorRole, loadData]
  );

  const handleDeleteAsset = useCallback(
    async (asset: ITAsset) => {
      if (!canManage) return;
      if (
        !confirm(
          `Remove "${asset.name}" (${asset.asset_tag}) from the active hardware register? It will be moved to the Recycle Bin.`
        )
      )
        return;

      const { error } = await supabase
        .from("it_assets")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", asset.id);

      if (error) {
        toast("Error", "Failed to delete asset", "error");
        return;
      }

      toast("Asset Removed", "Moved to Recycle Bin.", "success");
      logActivity({
        module: "it",
        action: "deleted",
        entityType: "it_asset",
        entityId: asset.id,
        actorName,
        actorRole,
        description: `Moved IT asset "${asset.name}" (${asset.asset_tag}) to the Recycle Bin`,
      });
      loadData();
    },
    [canManage, actorName, actorRole, loadData]
  );

  return {
    assetModal,
    setAssetModal,
    editingAsset,
    setEditingAsset,
    savingAsset,
    assetForm,
    setAssetForm,
    handleCreateAsset,
    openEditAsset,
    handleSaveAssetEdit,
    handleDeleteAsset,
  };
}
