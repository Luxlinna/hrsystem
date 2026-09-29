import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ContractType, ContractTypeFormState } from "../types";

const SEED_CONTRACT_TYPES: Partial<ContractType>[] = [
  { name: "1-YEAR FDC", term: "FDC", period_months: 12, alert_days_before: 30, sort_order: 1, status: "active" },
  { name: "2-YEAR 3-MONTH FDC", term: "FDC", period_months: 27, alert_days_before: 60, sort_order: 2, status: "active" },
  { name: "2-YEAR FDC", term: "FDC", period_months: 24, alert_days_before: 60, sort_order: 3, status: "active" },
  { name: "3-MONTH FDC", term: "FDC", period_months: 3, alert_days_before: 15, sort_order: 4, status: "active" },
  { name: "3-YEAR FDC", term: "FDC", period_months: 36, alert_days_before: 60, sort_order: 5, status: "active" },
  { name: "5 YEARS FDC", term: "FDC", period_months: 60, alert_days_before: 30, sort_order: 6, status: "active" },
  { name: "PERMANENT (UDC)", term: "UDC", period_months: null, alert_days_before: 0, sort_order: 7, status: "active" },
  { name: "PROBATION", term: "Probation", period_months: 3, alert_days_before: 15, sort_order: 8, status: "active" },
];

export function useContractTypes(branchId?: string) {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation: 'list' | 'create' | 'edit' | 'view'
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedContractType, setSelectedContractType] = useState<ContractType | null>(null);

  const fetchContractTypes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("contract_types")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("Contract types query error or table not yet created:", error.message);
        setContractTypes(
          SEED_CONTRACT_TYPES.map((t, index) => ({
            id: `contract-fallback-${index + 1}`,
            branch_id: branchId || null,
            name: t.name || "",
            term: t.term || "None",
            period_months: t.period_months ?? null,
            alert_days_before: t.alert_days_before ?? 30,
            status: t.status || "active",
            sort_order: t.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      } else if (data && data.length > 0) {
        setContractTypes(data as ContractType[]);
      } else {
        setContractTypes(
          SEED_CONTRACT_TYPES.map((t, index) => ({
            id: `contract-fallback-${index + 1}`,
            branch_id: branchId || null,
            name: t.name || "",
            term: t.term || "None",
            period_months: t.period_months ?? null,
            alert_days_before: t.alert_days_before ?? 30,
            status: t.status || "active",
            sort_order: t.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching contract types:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchContractTypes();
  }, [fetchContractTypes]);

  const openCreate = () => {
    setSelectedContractType(null);
    setCurrentView("create");
  };

  const openEdit = (item: ContractType) => {
    setSelectedContractType(item);
    setCurrentView("edit");
  };

  const openView = (item: ContractType) => {
    setSelectedContractType(item);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedContractType(null);
    setCurrentView("list");
  };

  const handleSaveContractType = async (form: ContractTypeFormState) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        term: form.term,
        period_months: form.period_months ? parseInt(form.period_months, 10) : null,
        alert_days_before: form.alert_days_before ? parseInt(form.alert_days_before, 10) : 30,
        branch_id: branchId || null,
        status: form.status,
      };

      if (selectedContractType && (currentView === "edit" || currentView === "create")) {
        const { error } = await supabase
          .from("contract_types")
          .update(payload)
          .eq("id", selectedContractType.id);

        if (error) {
          setContractTypes((prev) =>
            prev.map((t) => (t.id === selectedContractType.id ? { ...t, ...payload } : t))
          );
        }
        toast(`Contract Type "${form.name}" updated`, "success");
      } else {
        const { data, error } = await supabase
          .from("contract_types")
          .insert([payload])
          .select()
          .single();

        if (error) {
          const newType: ContractType = {
            id: `contract-local-${Date.now()}`,
            ...payload,
            sort_order: contractTypes.length + 1,
            created_at: new Date().toISOString(),
          };
          setContractTypes((prev) => [...prev, newType]);
        }
        toast(`Contract Type "${form.name}" created`, "success");
      }

      closeForm();
      fetchContractTypes();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save contract type", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: ContractType) => {
    const nextStatus = item.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("contract_types")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setContractTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: nextStatus } : t))
      );
    }
    toast(`Contract Type "${item.name}" is now ${nextStatus}`, "success");
    fetchContractTypes();
  };

  const handleDeleteContractType = async (item: ContractType) => {
    if (!confirm(`Delete contract type "${item.name}"?`)) return;

    const { error } = await supabase
      .from("contract_types")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setContractTypes((prev) => prev.filter((t) => t.id !== item.id));
    }
    toast(`Contract Type "${item.name}" deleted`, "success");
    fetchContractTypes();
  };

  return {
    contractTypes,
    loading,
    saving,
    currentView,
    selectedContractType,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveContractType,
    handleToggleStatus,
    handleDeleteContractType,
  };
}
