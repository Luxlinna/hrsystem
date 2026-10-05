import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Position, PositionFormState } from "../types";

export const DEFAULT_TAX_POSITIONS = [
  "Resident Employee", "Non-Resident Employee", "Senior Executive", "Director", "Managerial", "Specialist", "Staff", "Consultant / Contractor"
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
];

const STORAGE_KEY = "hr_deleted_position_ids";
const CACHE_KEY = "hr_positions_cache";
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const getDeletedSet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveDeletedIds = (ids: string[]) => {
  try {
    const set = getDeletedSet();
    ids.forEach((id) => set.add(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) { console.error(e); }
};

const getCachedPositions = (): Position[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveCachedPositions = (list: Position[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) { console.error(e); }
};

export function usePositions(branchId?: string) {
  const [positions, setPositions] = useState<Position[]>(() => {
    const cached = getCachedPositions();
    if (cached.length > 0) {
      const delSet = getDeletedSet();
      return cached.filter((p) => !delSet.has(p.id) && !delSet.has(p.name));
    }
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    const delSet = getDeletedSet();
    try {
      let query = supabase.from("positions").select("*").is("deleted_at", null).order("sort_order", { ascending: true }).order("name", { ascending: true });
      if (branchId && isUUID(branchId)) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }
      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        const cached = getCachedPositions();
        if (cached.length > 0) {
          setPositions(cached.filter((p) => !delSet.has(p.id) && !delSet.has(p.name)));
        } else {
          const fallbacks = SEED_POSITIONS
            .map((p, i) => ({ id: `pos-fallback-${i + 1}`, branch_id: branchId || null, name: p.name || "", tax_position: p.tax_position || null, status: p.status || "active", sort_order: p.sort_order ?? i + 1, created_at: new Date().toISOString() }))
            .filter((p) => !delSet.has(p.id) && !delSet.has(p.name));
          setPositions(fallbacks);
          saveCachedPositions(fallbacks as Position[]);
        }
      } else {
        const fresh = (data as Position[]).filter((p) => !delSet.has(p.id) && !delSet.has(p.name));
        setPositions(fresh);
        saveCachedPositions(fresh);
      }
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const openCreate = () => { setSelectedPosition(null); setCurrentView("create"); };
  const openEdit = (pos: Position) => { setSelectedPosition(pos); setCurrentView("edit"); };
  const openView = (pos: Position) => { setSelectedPosition(pos); setCurrentView("view"); };
  const closeForm = () => { setSelectedPosition(null); setCurrentView("list"); };

  const handleSavePosition = async (form: PositionFormState) => {
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), branch_id: branchId || null, tax_position: form.tax_position ? form.tax_position.trim() : null, status: form.status };
      if (selectedPosition && (currentView === "edit" || currentView === "create") && isUUID(selectedPosition.id)) {
        const { error } = await supabase.from("positions").update(payload).eq("id", selectedPosition.id);
        if (error) setPositions((prev) => prev.map((p) => (p.id === selectedPosition.id ? { ...p, ...payload } : p)));
        toast(`Position "${form.name}" updated`, "success");
      } else {
        const { data, error } = await supabase.from("positions").insert([payload]).select().single();
        const created = data || { id: `pos-local-${Date.now()}`, ...payload, sort_order: positions.length + 1, created_at: new Date().toISOString() };
        setPositions((prev) => [...prev.filter((p) => selectedPosition ? p.id !== selectedPosition.id : true), created as Position]);
        toast(`Position "${form.name}" saved`, "success");
      }
      closeForm();
    } catch (err: any) {
      toast(err.message || "Failed to save position", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (pos: Position) => {
    const nextStatus = pos.status === "disabled" ? "active" : "disabled";
    if (isUUID(pos.id)) {
      await supabase.from("positions").update({ status: nextStatus }).eq("id", pos.id);
    }
    setPositions((prev) => prev.map((p) => (p.id === pos.id ? { ...p, status: nextStatus } : p)));
    toast(`Position "${pos.name}" is now ${nextStatus}`, "success");
  };

  const handleDeletePosition = async (pos: Position) => {
    if (!confirm(`Delete position "${pos.name}"?`)) return;
    saveDeletedIds([pos.id, pos.name]);
    setPositions((prev) => prev.filter((p) => p.id !== pos.id));
    if (isUUID(pos.id)) {
      const now = new Date().toISOString();
      const { error } = await supabase.from("positions").update({ deleted_at: now }).eq("id", pos.id);
      if (error) await supabase.from("positions").delete().eq("id", pos.id);
    }
    toast(`Position "${pos.name}" deleted`, "success");
  };

  const handleBulkDeletePositions = async (ids: string[]) => {
    if (!ids?.length) return;
    if (!confirm(`Delete ${ids.length} selected position(s)?`)) return;
    const names = positions.filter((p) => ids.includes(p.id)).map((p) => p.name);
    saveDeletedIds([...ids, ...names]);
    setPositions((prev) => prev.filter((p) => !ids.includes(p.id)));
    const validUuids = ids.filter(isUUID);
    if (validUuids.length > 0) {
      const now = new Date().toISOString();
      const { error } = await supabase.from("positions").update({ deleted_at: now }).in("id", validUuids);
      if (error) await supabase.from("positions").delete().in("id", validUuids);
    }
    toast(`Deleted ${ids.length} position(s)`, "success");
  };

  const handleImportPositions = async (items: Array<{ name: string; tax_position?: string | null; status?: string; sort_order?: number }>) => {
    if (!items?.length) return false;
    setSaving(true);
    try {
      const payloads = items.map((item, idx) => ({ name: item.name.trim(), branch_id: branchId || null, tax_position: item.tax_position ? item.tax_position.trim() : null, status: item.status === "disabled" ? "disabled" : "active", sort_order: item.sort_order ?? (positions.length + idx + 1) }));
      const { data, error } = await supabase.from("positions").insert(payloads).select();
      if (error || !data) {
        const newPos = payloads.map((p, idx) => ({ id: `pos-imported-${Date.now()}-${idx}`, ...p, created_at: new Date().toISOString() }));
        setPositions((prev) => [...prev, ...newPos]);
      } else {
        setPositions((prev) => [...prev, ...(data as Position[])]);
      }
      toast(`Successfully imported ${payloads.length} position(s)`, "success");
      return true;
    } catch (err: any) {
      toast(err.message || "Failed to import positions", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { positions, loading, saving, currentView, selectedPosition, openCreate, openEdit, openView, closeForm, handleSavePosition, handleToggleStatus, handleDeletePosition, handleBulkDeletePositions, handleImportPositions };
}
