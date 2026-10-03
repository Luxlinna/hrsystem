import { useState, useCallback } from "react";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { StationeryItem, StationeryItemFormState } from "../../types";
import { INITIAL_STATIONERY_FORM } from "../../constants";

interface UseStationeryItemMutationsProps {
  items: StationeryItem[];
  setItems: React.Dispatch<React.SetStateAction<StationeryItem[]>>;
  actorName: string;
  actorRole: string;
  targetBranch: string | null;
}

export function useStationeryItemMutations({
  items,
  setItems,
  actorName,
  actorRole,
  targetBranch,
}: UseStationeryItemMutationsProps) {
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StationeryItem | null>(null);
  const [itemForm, setItemForm] = useState<StationeryItemFormState>(INITIAL_STATIONERY_FORM);

  const [restockModal, setRestockModal] = useState(false);
  const [restockTargetItem, setRestockTargetItem] = useState<StationeryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<number>(10);

  const handleOpenNewItem = useCallback(() => {
    setEditingItem(null);
    setItemForm({ ...INITIAL_STATIONERY_FORM, branch_id: targetBranch || "" });
    setItemModal(true);
  }, [targetBranch]);

  const handleOpenEditItem = useCallback((item: StationeryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      sku: item.sku,
      stock_quantity: item.stock_quantity,
      min_stock_level: item.min_stock_level,
      unit: item.unit,
      unit_cost: item.unit_cost ?? "",
      location: item.location || "",
      branch_id: item.branch_id || "",
    });
    setItemModal(true);
  }, []);

  const handleSaveItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.sku.trim()) {
      toast("Error", "Item name and SKU code are required.", "error");
      return;
    }

    if (editingItem) {
      const updated: StationeryItem = {
        ...editingItem,
        name: itemForm.name.trim(),
        category: itemForm.category,
        sku: itemForm.sku.trim().toUpperCase(),
        stock_quantity: Number(itemForm.stock_quantity) || 0,
        min_stock_level: Number(itemForm.min_stock_level) || 0,
        unit: itemForm.unit.trim(),
        unit_cost: itemForm.unit_cost === "" ? null : Number(itemForm.unit_cost),
        location: itemForm.location.trim() || null,
        branch_id: itemForm.branch_id || null,
        updated_at: new Date().toISOString(),
      };
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? updated : i)));
      toast("Item Updated", `${updated.name} has been updated.`, "success");
      logActivity({
        module: "it",
        action: "updated",
        entityType: "stationery_item",
        entityId: editingItem.id,
        actorName,
        actorRole,
        description: `Updated stationery item: ${updated.name} (${updated.sku})`,
        metadata: { name: updated.name, sku: updated.sku, stock: updated.stock_quantity },
      });
    } else {
      const newItem: StationeryItem = {
        id: `stat-${Date.now()}`,
        name: itemForm.name.trim(),
        category: itemForm.category,
        sku: itemForm.sku.trim().toUpperCase(),
        stock_quantity: Number(itemForm.stock_quantity) || 0,
        min_stock_level: Number(itemForm.min_stock_level) || 0,
        unit: itemForm.unit.trim(),
        unit_cost: itemForm.unit_cost === "" ? null : Number(itemForm.unit_cost),
        location: itemForm.location.trim() || null,
        branch_id: itemForm.branch_id || targetBranch || null,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      toast("Item Created", `${newItem.name} added to supplies catalog.`, "success");
      logActivity({
        module: "it",
        action: "created",
        entityType: "stationery_item",
        entityId: newItem.id,
        actorName,
        actorRole,
        description: `Created new stationery supply: ${newItem.name} (${newItem.sku})`,
        metadata: { name: newItem.name, sku: newItem.sku, stock: newItem.stock_quantity },
      });
    }

    setItemModal(false);
  }, [itemForm, editingItem, targetBranch, actorName, actorRole, setItems]);

  const handleDeleteItem = useCallback(async (item: StationeryItem) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast("Item Deleted", `${item.name} has been removed.`, "info");
    logActivity({
      module: "it",
      action: "deleted",
      entityType: "stationery_item",
      entityId: item.id,
      actorName,
      actorRole,
      description: `Deleted stationery supply: ${item.name} (${item.sku})`,
      metadata: { name: item.name, sku: item.sku },
    });
  }, [actorName, actorRole, setItems]);

  const handleOpenRestock = useCallback((item: StationeryItem) => {
    setRestockTargetItem(item);
    setRestockQuantity(10);
    setRestockModal(true);
  }, []);

  const handleConfirmRestock = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTargetItem || restockQuantity <= 0) return;

    const newQty = restockTargetItem.stock_quantity + restockQuantity;
    setItems((prev) =>
      prev.map((i) => (i.id === restockTargetItem.id ? { ...i, stock_quantity: newQty, updated_at: new Date().toISOString() } : i))
    );

    toast("Stock Updated", `Added +${restockQuantity} ${restockTargetItem.unit} to ${restockTargetItem.name}. New Total: ${newQty}`, "success");
    logActivity({
      module: "it",
      action: "updated",
      entityType: "stationery_item",
      entityId: restockTargetItem.id,
      actorName,
      actorRole,
      description: `Restocked ${restockTargetItem.name} with +${restockQuantity} ${restockTargetItem.unit}`,
      metadata: { name: restockTargetItem.name, added: restockQuantity, total: newQty },
    });
    setRestockModal(false);
  }, [restockTargetItem, restockQuantity, actorName, actorRole, setItems]);

  return {
    itemModal,
    setItemModal,
    editingItem,
    itemForm,
    setItemForm,
    handleOpenNewItem,
    handleOpenEditItem,
    handleSaveItem,
    handleDeleteItem,
    restockModal,
    setRestockModal,
    restockTargetItem,
    restockQuantity,
    setRestockQuantity,
    handleOpenRestock,
    handleConfirmRestock,
  };
}
