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
      if (!assetForm.name || !canManage || savingAsset) return;
      setSavingAsset(true);

      const resolvedBranch = targetBranch || assetForm.branch_id || null;
      const resolvedTag =
        assetForm.asset_tag?.trim() ||
        `AST-${Math.floor(1000 + Math.random() * 9000)}`;
      const resolvedCategory = assetForm.category || assetForm.type || "Other";
      const resolvedType =
        resolvedCategory.includes("Laptop") ? "Laptop" :
        resolvedCategory.includes("Desktop") ? "Display" :
        resolvedCategory.includes("Display") || resolvedCategory.includes("Monitor") ? "Display" :
        resolvedCategory.includes("Mobile") || resolvedCategory.includes("Phone") ? "Mobile" :
        resolvedCategory.includes("Peripheral") ? "Peripheral" :
        resolvedCategory.includes("Furniture") ? "Furniture" :
        resolvedCategory.includes("Server") ? "Server" :
        resolvedCategory.includes("Network") ? "Network" : "Other";

      let { error } = await supabase.from("it_assets").insert([
        {
          name: assetForm.name,
          asset_tag: resolvedTag,
          type: resolvedType,
          category: resolvedCategory,
          purchase_date: assetForm.purchase_date || null,
          description: assetForm.description || null,
          condition: assetForm.condition || "New",
          price: Number(assetForm.price) || 0,
          price_currency: assetForm.price_currency || "USD",
          site: assetForm.site || null,
          serial_number: assetForm.serial_number || null,
          branch_id: resolvedBranch,
          employee_id: assetForm.employee_id || null,
          status: assetForm.employee_id ? "active" : assetForm.status || "inventory",
          photo_url: assetForm.photo_url || null,
          attachments: assetForm.attachments || [],
        },
      ]);

      // If database has not yet run the migration for new columns, gracefully fallback to core schema
      if (error && (error.message?.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
        console.warn("Retrying it_assets insert with core columns:", error.message);
        const fallbackRes = await supabase.from("it_assets").insert([
          {
            name: assetForm.name,
            asset_tag: resolvedTag,
            type: resolvedType,
            serial_number: assetForm.serial_number || null,
            branch_id: resolvedBranch,
            employee_id: assetForm.employee_id || null,
            status: assetForm.employee_id ? "active" : assetForm.status || "inventory",
          },
        ]);
        error = fallbackRes.error;
      }

      setSavingAsset(false);
      if (error) {
        console.error("Failed to register asset:", error);
        toast("Error", error.message || "Failed to register asset", "error");
        return;
      }

      setAssetModal(false);
      setAssetForm(INITIAL_ASSET_FORM);
      toast("Asset Registered", `Added ${assetForm.name} to asset inventory.`, "success");
      logActivity({
        module: "it",
        action: "created",
        entityType: "it_asset",
        actorName,
        actorRole,
        description: `Registered new IT asset "${assetForm.name}" (${resolvedTag})`,
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
        category: asset.category || asset.type || "Other",
        purchase_date: asset.purchase_date || new Date().toISOString().split("T")[0],
        description: asset.description || "",
        condition: asset.condition || "New",
        price: asset.price ?? 0,
        price_currency: asset.price_currency || "USD",
        site: asset.site || "",
        serial_number: asset.serial_number || "",
        branch_id: asset.branch_id || targetBranch || "",
        employee_id: asset.employee_id || "",
        status: asset.status || "inventory",
        photo_url: asset.photo_url || null,
        attachments: asset.attachments || [],
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
      const resolvedCategory = assetForm.category || assetForm.type || "Other";
      const resolvedType =
        resolvedCategory.includes("Laptop") ? "Laptop" :
        resolvedCategory.includes("Desktop") ? "Display" :
        resolvedCategory.includes("Display") || resolvedCategory.includes("Monitor") ? "Display" :
        resolvedCategory.includes("Mobile") || resolvedCategory.includes("Phone") ? "Mobile" :
        resolvedCategory.includes("Peripheral") ? "Peripheral" :
        resolvedCategory.includes("Furniture") ? "Furniture" :
        resolvedCategory.includes("Server") ? "Server" :
        resolvedCategory.includes("Network") ? "Network" : "Other";

      let { error } = await supabase
        .from("it_assets")
        .update({
          name: assetForm.name,
          asset_tag: assetForm.asset_tag,
          type: resolvedType,
          category: resolvedCategory,
          purchase_date: assetForm.purchase_date || null,
          description: assetForm.description || null,
          condition: assetForm.condition || "New",
          price: Number(assetForm.price) || 0,
          price_currency: assetForm.price_currency || "USD",
          site: assetForm.site || null,
          serial_number: assetForm.serial_number || null,
          branch_id: resolvedBranch,
          employee_id: assetForm.employee_id || null,
          status: assetForm.status,
          photo_url: assetForm.photo_url || null,
          attachments: assetForm.attachments || [],
        })
        .eq("id", editingAsset.id);

      // Fallback to core columns if database migration not yet run
      if (error && (error.message?.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
        console.warn("Retrying it_assets update with core columns:", error.message);
        const fallbackRes = await supabase
          .from("it_assets")
          .update({
            name: assetForm.name,
            asset_tag: assetForm.asset_tag,
            type: resolvedType,
            serial_number: assetForm.serial_number || null,
            branch_id: resolvedBranch,
            employee_id: assetForm.employee_id || null,
            status: assetForm.status,
          })
          .eq("id", editingAsset.id);
        error = fallbackRes.error;
      }

      setSavingAsset(false);
      if (error) {
        console.error("Failed to update asset:", error);
        toast("Error", error.message || "Failed to update asset", "error");
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
