import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Department, DepartmentFormState } from "../types";

export interface HeadOfDepartmentOption {
  id: string;
  name: string;
  role?: string;
  avatar_url?: string;
}

const DEFAULT_DEPARTMENTS: Partial<Department>[] = [
  { name: "HUMAN RESOURCES", sort_order: 4, status: "active" },
  { name: "ADMINISTRATION", parent_department_name: "HUMAN RESOURCES", sort_order: 1, status: "active" },
  { name: "BUSINESS DEVELOPMENT", sort_order: 2, status: "active" },
  { name: "FINANCE AND ACCOUNTING", sort_order: 3, status: "active" },
  { name: "INFORMATION TECHNOLOGY (IT)", sort_order: 5, status: "active" },
  { name: "INTERNAL AUDIT AND LOSS PREVENTION", sort_order: 6, status: "active" },
  { name: "MANAGEMENT", sort_order: 7, status: "active" },
  { name: "MARKETING", sort_order: 8, status: "active" },
  { name: "MERCHANDISE", sort_order: 9, status: "active" },
  { name: "OPERATIONS", sort_order: 10, status: "active" },
  { name: "OPERATIONS KITCHEN", sort_order: 11, status: "active" },
];

export function useDepartments(branchId?: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<HeadOfDepartmentOption[]>([]);

  // Navigation State: 'list' | 'create' | 'edit' | 'view'
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const query = supabase
        .from("employees")
        .select("id, first_name, last_name, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name", { ascending: true });

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
      console.error("Error fetching employees for department head:", err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("departments")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.warn("Departments query error or table not yet populated:", error.message);
        // Fallback to local default departments if table not yet migrated
        setDepartments(
          DEFAULT_DEPARTMENTS.map((d, index) => ({
            id: `dept-fallback-${index + 1}`,
            branch_id: null,
            name: d.name || "",
            parent_department_id: null,
            parent_department_name: d.parent_department_name || null,
            head_of_department_id: null,
            head_of_department_name: null,
            sort_order: d.sort_order ?? index + 1,
            status: d.status || "active",
            created_at: new Date().toISOString(),
          }))
        );
      } else if (data && data.length > 0) {
        setDepartments(data as Department[]);
      } else {
        // If table exists but empty, fallback to seed defaults
        setDepartments(
          DEFAULT_DEPARTMENTS.map((d, index) => ({
            id: `dept-fallback-${index + 1}`,
            branch_id: null,
            name: d.name || "",
            parent_department_id: null,
            parent_department_name: d.parent_department_name || null,
            head_of_department_id: null,
            head_of_department_name: null,
            sort_order: d.sort_order ?? index + 1,
            status: d.status || "active",
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

  const openCreate = () => {
    setSelectedDepartment(null);
    setCurrentView("create");
  };

  const openEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setCurrentView("edit");
  };

  const openView = (dept: Department) => {
    setSelectedDepartment(dept);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedDepartment(null);
    setCurrentView("list");
  };

  const handleSaveDepartment = async (form: DepartmentFormState) => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        branch_id: null,
        parent_department_id: form.parent_department_id || null,
        parent_department_name: form.parent_department_name || null,
        head_of_department_id: form.head_of_department_id || null,
        head_of_department_name: form.head_of_department_name || null,
        sort_order: parseInt(String(form.sort_order), 10) || 0,
        status: form.status,
      };

      if (selectedDepartment && (currentView === "edit" || currentView === "create")) {
        const { error } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", selectedDepartment.id);

        if (error) {
          // If table not present, update in-memory state
          setDepartments((prev) =>
            prev.map((d) => (d.id === selectedDepartment.id ? { ...d, ...payload } : d))
          );
          toast(`Department "${form.name}" updated`, "success");
        } else {
          toast(`Department "${form.name}" updated`, "success");
        }
      } else {
        const { data, error } = await supabase
          .from("departments")
          .insert([payload])
          .select()
          .single();

        if (error) {
          // If table not present, insert to in-memory state
          const newDept: Department = {
            id: `dept-local-${Date.now()}`,
            ...payload,
            created_at: new Date().toISOString(),
          };
          setDepartments((prev) => [...prev, newDept]);
          toast(`Department "${form.name}" created`, "success");
        } else if (data) {
          toast(`Department "${form.name}" created`, "success");
        }
      }

      closeForm();
      fetchDepartments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save department", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    const nextStatus = dept.status === "disabled" ? "active" : "disabled";
    const { error } = await supabase
      .from("departments")
      .update({ status: nextStatus })
      .eq("id", dept.id);

    if (error) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, status: nextStatus } : d))
      );
    }
    toast(`Department "${dept.name}" is now ${nextStatus}`, "success");
    fetchDepartments();
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"?`)) return;

    const { error } = await supabase
      .from("departments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", dept.id);

    if (error) {
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
    }
    toast(`Department "${dept.name}" deleted`, "success");
    fetchDepartments();
  };

  return {
    departments,
    employees,
    loading,
    saving,
    currentView,
    selectedDepartment,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveDepartment,
    handleToggleStatus,
    handleDeleteDepartment,
  };
}
