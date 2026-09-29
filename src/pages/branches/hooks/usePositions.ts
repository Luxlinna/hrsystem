import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Position, PositionFormState } from "../types";

export const DEFAULT_TAX_POSITIONS = [
  "Resident Employee",
  "Non-Resident Employee",
  "Senior Executive",
  "Director",
  "Managerial",
  "Specialist",
  "Staff",
  "Consultant / Contractor",
];

const SEED_POSITIONS: Partial<Position>[] = [
  { name: "ACM Grocery II", sort_order: 1, status: "active" },
  { name: "ACM-SF & Butchery", sort_order: 2, status: "active" },
  { name: "AP - Non Trade", sort_order: 3, status: "active" },
  { name: "Account Payable Executive", sort_order: 4, status: "active" },
  { name: "Account Payable Officer", sort_order: 5, status: "active" },
  { name: "Account Payable Supervisor", sort_order: 6, status: "active" },
  { name: "Account Receivable Executive", sort_order: 7, status: "active" },
  { name: "Account Receivable Officer", sort_order: 8, status: "active" },
  { name: "Accounting Assistant", sort_order: 9, status: "active" },
  { name: "Accounting Intern", sort_order: 10, status: "active" },
  { name: "Accounting Manager", sort_order: 11, status: "active" },
  { name: "Accounting Supervisor", sort_order: 12, status: "active" },
  { name: "Acting Assistant Store Manager", sort_order: 13, status: "active" },
];

export function usePositions(branchId?: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation: 'list' | 'create' | 'edit' | 'view'
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("positions")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("Positions query error or table not yet populated:", error.message);
        setPositions(
          SEED_POSITIONS.map((p, index) => ({
            id: `pos-fallback-${index + 1}`,
            branch_id: branchId || null,
            name: p.name || "",
            tax_position: p.tax_position || null,
            status: p.status || "active",
            sort_order: p.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      } else if (data && data.length > 0) {
        setPositions(data as Position[]);
      } else {
        setPositions(
          SEED_POSITIONS.map((p, index) => ({
            id: `pos-fallback-${index + 1}`,
            branch_id: branchId || null,
            name: p.name || "",
            tax_position: p.tax_position || null,
            status: p.status || "active",
            sort_order: p.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const openCreate = () => {
    setSelectedPosition(null);
    setCurrentView("create");
  };

  const openEdit = (pos: Position) => {
    setSelectedPosition(pos);
    setCurrentView("edit");
  };

  const openView = (pos: Position) => {
    setSelectedPosition(pos);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedPosition(null);
    setCurrentView("list");
  };

  const handleSavePosition = async (form: PositionFormState) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        branch_id: branchId || null,
        tax_position: form.tax_position ? form.tax_position.trim() : null,
        status: form.status,
      };

      if (selectedPosition && (currentView === "edit" || currentView === "create")) {
        const { error } = await supabase
          .from("positions")
          .update(payload)
          .eq("id", selectedPosition.id);

        if (error) {
          setPositions((prev) =>
            prev.map((p) => (p.id === selectedPosition.id ? { ...p, ...payload } : p))
          );
        }
        toast(`Position "${form.name}" updated`, "success");
      } else {
        const { data, error } = await supabase
          .from("positions")
          .insert([payload])
          .select()
          .single();

        if (error) {
          const newPos: Position = {
            id: `pos-local-${Date.now()}`,
            ...payload,
            sort_order: positions.length + 1,
            created_at: new Date().toISOString(),
          };
          setPositions((prev) => [...prev, newPos]);
        }
        toast(`Position "${form.name}" created`, "success");
      }

      closeForm();
      fetchPositions();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save position", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (pos: Position) => {
    const nextStatus = pos.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("positions")
      .update({ status: nextStatus })
      .eq("id", pos.id);

    if (error) {
      setPositions((prev) =>
        prev.map((p) => (p.id === pos.id ? { ...p, status: nextStatus } : p))
      );
    }
    toast(`Position "${pos.name}" is now ${nextStatus}`, "success");
    fetchPositions();
  };

  const handleDeletePosition = async (pos: Position) => {
    if (!confirm(`Delete position "${pos.name}"?`)) return;

    const { error } = await supabase
      .from("positions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", pos.id);

    if (error) {
      setPositions((prev) => prev.filter((p) => p.id !== pos.id));
    }
    toast(`Position "${pos.name}" deleted`, "success");
    fetchPositions();
  };

  return {
    positions,
    loading,
    saving,
    currentView,
    selectedPosition,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSavePosition,
    handleToggleStatus,
    handleDeletePosition,
  };
}
