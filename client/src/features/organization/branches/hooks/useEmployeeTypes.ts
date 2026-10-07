import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { EmployeeType, EmployeeTypeFormState } from "../types";

const SEED_EMPLOYEE_TYPES: Partial<EmployeeType>[] = [
  { name: "FULL-TIME", sort_order: 1, status: "active" },
  { name: "HOD", sort_order: 2, status: "active" },
  { name: "INTERNSHIP", sort_order: 3, status: "active" },
  { name: "PART-TIME", sort_order: 4, status: "active" },
];

export function useEmployeeTypes(branchId?: string) {
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation: 'list' | 'create' | 'edit' | 'view'
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<EmployeeType | null>(null);

  const fetchEmployeeTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employee_types")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        setEmployeeTypes(
          SEED_EMPLOYEE_TYPES.map((t, index) => ({
            id: `emptype-fallback-${index + 1}`,
            branch_id: null,
            name: t.name || "",
            status: t.status || "active",
            sort_order: t.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      } else if (data && data.length > 0) {
        setEmployeeTypes(data as EmployeeType[]);
      } else {
        setEmployeeTypes(
          SEED_EMPLOYEE_TYPES.map((t, index) => ({
            id: `emptype-fallback-${index + 1}`,
            branch_id: null,
            name: t.name || "",
            status: t.status || "active",
            sort_order: t.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching employee types:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeTypes();
  }, [fetchEmployeeTypes]);

  const openCreate = () => {
    setSelectedEmployeeType(null);
    setCurrentView("create");
  };

  const openEdit = (item: EmployeeType) => {
    setSelectedEmployeeType(item);
    setCurrentView("edit");
  };

  const openView = (item: EmployeeType) => {
    setSelectedEmployeeType(item);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedEmployeeType(null);
    setCurrentView("list");
  };

  const handleSaveEmployeeType = async (form: EmployeeTypeFormState) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        branch_id: null,
        status: form.status,
      };

      if (selectedEmployeeType && (currentView === "edit" || currentView === "create")) {
        const { error } = await supabase
          .from("employee_types")
          .update(payload)
          .eq("id", selectedEmployeeType.id);

        if (error) {
          setEmployeeTypes((prev) =>
            prev.map((t) => (t.id === selectedEmployeeType.id ? { ...t, ...payload } : t))
          );
        }
        toast(`Employee Type "${form.name}" updated`, "success");
      } else {
        const { data, error } = await supabase
          .from("employee_types")
          .insert([payload])
          .select()
          .single();

        if (error) {
          const newType: EmployeeType = {
            id: `emptype-local-${Date.now()}`,
            ...payload,
            sort_order: employeeTypes.length + 1,
            created_at: new Date().toISOString(),
          };
          setEmployeeTypes((prev) => [...prev, newType]);
        }
        toast(`Employee Type "${form.name}" created`, "success");
      }

      closeForm();
      fetchEmployeeTypes();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save employee type", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: EmployeeType) => {
    const nextStatus = item.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("employee_types")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setEmployeeTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: nextStatus } : t))
      );
    }
    toast(`Employee Type "${item.name}" is now ${nextStatus}`, "success");
    fetchEmployeeTypes();
  };

  const handleDeleteEmployeeType = async (item: EmployeeType) => {
    if (!confirm(`Delete employee type "${item.name}"?`)) return;

    const { error } = await supabase
      .from("employee_types")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setEmployeeTypes((prev) => prev.filter((t) => t.id !== item.id));
    }
    toast(`Employee Type "${item.name}" deleted`, "success");
    fetchEmployeeTypes();
  };

  return {
    employeeTypes,
    loading,
    saving,
    currentView,
    selectedEmployeeType,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveEmployeeType,
    handleToggleStatus,
    handleDeleteEmployeeType,
  };
}
