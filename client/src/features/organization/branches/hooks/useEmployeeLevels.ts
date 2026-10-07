import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { EmployeeLevel, EmployeeLevelFormState } from "../types";

const SEED_EMPLOYEE_LEVELS: Partial<EmployeeLevel>[] = [
  { name: "Intern",    sort_order: 1, status: "active" },
  { name: "Junior",   sort_order: 2, status: "active" },
  { name: "Mid-level", sort_order: 3, status: "active" },
  { name: "Senior",   sort_order: 4, status: "active" },
  { name: "Lead",     sort_order: 5, status: "active" },
  { name: "Manager",  sort_order: 6, status: "active" },
  { name: "Director", sort_order: 7, status: "active" },
  { name: "Executive", sort_order: 8, status: "active" },
];

function makeSeedLevels(): EmployeeLevel[] {
  return SEED_EMPLOYEE_LEVELS.map((l, index) => ({
    id: `emploevel-fallback-${index + 1}`,
    branch_id: null,
    name: l.name || "",
    remark: null,
    status: l.status || "active",
    sort_order: l.sort_order ?? index + 1,
    created_at: new Date().toISOString(),
  }));
}

export function useEmployeeLevels(branchId?: string) {
  const [employeeLevels, setEmployeeLevels] = useState<EmployeeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedEmployeeLevel, setSelectedEmployeeLevel] = useState<EmployeeLevel | null>(null);

  const fetchEmployeeLevels = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employee_levels")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.warn("Employee levels query error or table not yet created:", error.message);
        setEmployeeLevels(makeSeedLevels());
      } else if (data && data.length > 0) {
        setEmployeeLevels(data as EmployeeLevel[]);
      } else {
        // Table exists but empty — show seed defaults so BU page is never blank
        setEmployeeLevels(makeSeedLevels());
      }
    } catch (err) {
      console.error("Error fetching employee levels:", err);
      setEmployeeLevels(makeSeedLevels());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeLevels();
  }, [fetchEmployeeLevels]);

  const openCreate = () => { setSelectedEmployeeLevel(null); setModalMode("create"); setIsModalOpen(true); };
  const openEdit = (item: EmployeeLevel) => { setSelectedEmployeeLevel(item); setModalMode("edit"); setIsModalOpen(true); };
  const openView = (item: EmployeeLevel) => { setSelectedEmployeeLevel(item); setModalMode("view"); setIsModalOpen(true); };
  const closeModal = () => { setSelectedEmployeeLevel(null); setIsModalOpen(false); };

  const handleSaveEmployeeLevel = async (form: EmployeeLevelFormState) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        remark: form.remark ? form.remark.trim() : null,
        branch_id: null,
        status: form.status,
      };

      if (selectedEmployeeLevel && (modalMode === "edit" || modalMode === "create")) {
        const { error } = await supabase
          .from("employee_levels")
          .update(payload)
          .eq("id", selectedEmployeeLevel.id);

        if (error) {
          setEmployeeLevels((prev) =>
            prev.map((t) => (t.id === selectedEmployeeLevel.id ? { ...t, ...payload } : t))
          );
        }
        toast(`Employee Level "${form.name}" updated`, "success");
      } else {
        const { error } = await supabase
          .from("employee_levels")
          .insert([payload])
          .select()
          .single();

        if (error) {
          const newLevel: EmployeeLevel = {
            id: `emplevel-local-${Date.now()}`,
            ...payload,
            sort_order: employeeLevels.length + 1,
            created_at: new Date().toISOString(),
          };
          setEmployeeLevels((prev) => [...prev, newLevel]);
        }
        toast(`Employee Level "${form.name}" created`, "success");
      }

      closeModal();
      fetchEmployeeLevels();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save employee level", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: EmployeeLevel) => {
    const nextStatus = item.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("employee_levels")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      setEmployeeLevels((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: nextStatus } : t))
      );
    }
    toast(`Employee Level "${item.name}" is now ${nextStatus}`, "success");
    fetchEmployeeLevels();
  };

  const handleDeleteEmployeeLevel = async (item: EmployeeLevel) => {
    if (!confirm(`Delete employee level "${item.name}"?`)) return;

    const { error } = await supabase
      .from("employee_levels")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      setEmployeeLevels((prev) => prev.filter((t) => t.id !== item.id));
    }
    toast(`Employee Level "${item.name}" deleted`, "success");
    fetchEmployeeLevels();
  };

  return {
    employeeLevels,
    loading,
    saving,
    isModalOpen,
    modalMode,
    selectedEmployeeLevel,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSaveEmployeeLevel,
    handleToggleStatus,
    handleDeleteEmployeeLevel,
  };
}
