import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { NssfEmployee } from "../types";

export function useNssf() {
  const { targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [employees, setEmployees] = useState<NssfEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "registered" | "unregistered">("all");
  const [importModal, setImportModal] = useState(false);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, status, department, role, avatar_url, branch_id, join_date")
      .eq("branch_id", targetBranch)
      .is("deleted_at", null)
      .order("first_name");

    if (error) {
      // If migration hasn't been run yet, still show basic employee list
      console.warn("NSSF query error (migration may not be applied yet):", error.message);
    }

    const mapped: NssfEmployee[] = (data || []).map((e: any) => ({
      id: e.id,
      first_name: e.first_name,
      last_name: e.last_name,
      status: e.status,
      department: e.department,
      role: e.role,
      avatar_url: e.avatar_url,
      branch_id: e.branch_id,
      join_date: e.join_date,
      // NSSF fields — available after migration is applied:
      nssf_number: e.nssf_number ?? null,
      kh_name: e.kh_name ?? null,
      nationality: e.nationality ?? null,
      gender: e.gender ?? null,
      date_of_birth: e.date_of_birth ?? null,
      basic_salary: e.basic_salary ?? null,
      branch: null,
    }));
    setEmployees(mapped);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save updated NSSF fields for a single employee
  const saveEmployee = useCallback(
    async (
      id: string,
      updates: Partial<Pick<NssfEmployee, "nssf_number" | "kh_name" | "nationality" | "gender" | "date_of_birth" | "basic_salary">>
    ) => {
      setSaving(true);
      const { error } = await supabase.from("employees").update(updates).eq("id", id);
      if (!error) await loadData();
      setSaving(false);
      return !error;
    },
    [loadData]
  );

  // Bulk upsert from import
  const bulkImport = useCallback(
    async (rows: Partial<NssfEmployee>[]) => {
      setSaving(true);
      // Update employees by id or nssf_number
      const updates = rows.map(async (row) => {
        if (!row.id) return;
        return supabase
          .from("employees")
          .update({
            nssf_number: row.nssf_number,
            kh_name: row.kh_name,
            nationality: row.nationality,
            gender: row.gender,
            date_of_birth: row.date_of_birth,
            basic_salary: row.basic_salary,
          })
          .eq("id", row.id);
      });
      await Promise.all(updates);
      await loadData();
      setSaving(false);
    },
    [loadData]
  );

  // Filtered employees
  const filtered = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      e.id.toLowerCase().includes(q) ||
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      (e.kh_name || "").toLowerCase().includes(q) ||
      (e.nssf_number || "").toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "registered" && !!e.nssf_number) ||
      (statusFilter === "unregistered" && !e.nssf_number);

    return matchSearch && matchStatus;
  });

  const registeredCount = employees.filter((e) => !!e.nssf_number).length;
  const unregisteredCount = employees.filter((e) => !e.nssf_number).length;

  return {
    employees,
    filtered,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    importModal,
    setImportModal,
    saveEmployee,
    bulkImport,
    loadData,
    registeredCount,
    unregisteredCount,
  };
}
