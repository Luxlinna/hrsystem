import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Division, DivisionFormState } from "../types";

export interface HeadOfDivisionOption {
  id: string;
  name: string;
  role?: string;
  avatar_url?: string;
}

export function useDivisions(branchId?: string) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<HeadOfDivisionOption[]>([]);

  // Navigation State: 'list' | 'create' | 'edit' | 'view'
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const query = supabase
        .from("employees")
        .select("id, first_name, last_name, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name", { ascending: true });

      if (branchId) {
        query.eq("branch_id", branchId);
      }

      const { data } = await query;
      if (data) {
        setEmployees(
          data.map((e) => ({
            id: e.id,
            name: `${e.first_name} ${e.last_name}`.trim(),
            role: e.role,
            avatar_url: e.avatar_url,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching employees for division head:", err);
    }
  }, [branchId]);

  const fetchDivisions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("divisions")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setDivisions(data as Division[]);
      } else {
        if (error) {
          console.warn("Divisions query warning:", error.message);
        }
        setDivisions([]);
      }
    } catch (err) {
      console.error("Error fetching divisions:", err);
      setDivisions([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchDivisions();
    fetchEmployees();
  }, [fetchDivisions, fetchEmployees]);

  const openCreate = () => {
    setSelectedDivision(null);
    setCurrentView("create");
  };

  const openEdit = (div: Division) => {
    setSelectedDivision(div);
    setCurrentView("edit");
  };

  const openView = (div: Division) => {
    setSelectedDivision(div);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedDivision(null);
    setCurrentView("list");
  };

  const handleSaveDivision = async (form: DivisionFormState) => {
    setSaving(true);
    try {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validHeadId =
        form.head_of_division_id && UUID_REGEX.test(form.head_of_division_id.trim())
          ? form.head_of_division_id.trim()
          : null;

      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || null,
        branch_id: branchId && UUID_REGEX.test(branchId) ? branchId : null,
        head_of_division_id: validHeadId,
        head_of_division_name: form.head_of_division_name?.trim() || null,
        status: form.status,
      };

      if (selectedDivision && (currentView === "edit" || currentView === "create")) {
        const { error } = await supabase
          .from("divisions")
          .update(payload)
          .eq("id", selectedDivision.id);

        if (error) {
          throw new Error(error.message);
        }
        toast(`Division "${form.name}" updated`, "success");
      } else {
        const { error } = await supabase
          .from("divisions")
          .insert([payload]);

        if (error) {
          throw new Error(error.message);
        }
        toast(`Division "${form.name}" created`, "success");
      }

      closeForm();
      await fetchDivisions();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save division", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (div: Division) => {
    const nextStatus = div.status === "disabled" ? "active" : "disabled";

    setDivisions((prev) =>
      prev.map((d) => (d.id === div.id ? { ...d, status: nextStatus } : d))
    );

    const { error } = await supabase
      .from("divisions")
      .update({ status: nextStatus })
      .eq("id", div.id);

    if (error) {
      console.error("Error updating status:", error);
    }

    toast(`Division "${div.name}" is now ${nextStatus}`, "success");
    await fetchDivisions();
  };

  const handleDeleteDivision = async (div: Division) => {
    if (!confirm(`Delete division "${div.name}"?`)) return;

    // Immediately remove from UI state
    setDivisions((prev) => prev.filter((d) => d.id !== div.id));

    // Perform database soft-delete
    try {
      const { error } = await supabase
        .from("divisions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", div.id);

      if (error) {
        console.error("Error deleting division:", error);
      }
    } catch (err) {
      console.error("Error deleting division:", err);
    }

    toast(`Division "${div.name}" deleted`, "success");
    await fetchDivisions();
  };

  return {
    divisions,
    employees,
    loading,
    saving,
    currentView,
    selectedDivision,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveDivision,
    handleToggleStatus,
    handleDeleteDivision,
  };
}
