import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { ITAsset, ITTicket, Employee, Branch } from "../types";

export function useITData() {
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' IT assets or tickets.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch branches
      const { data: b } = await supabase.from("branches").select("id, name").order("name");
      setBranches((b as Branch[]) || []);

      // 2. Strict Partner Branch Isolation: If user does not belong to this branch, block IT access
      if (isPartnerBranchBlocked || !targetBranch) {
        setAssets([]);
        setTickets([]);
        setEmployees([]);
        setLoading(false);
        return;
      }

      // 3. Fetch branch-scoped assets, tickets, and employee roster
      const [{ data: a }, { data: t }, { data: e }] = await Promise.all([
        supabase
          .from("it_assets")
          .select(
            "id, name, asset_tag, type, employee_id, branch_id, status, serial_number, created_at, employees(id, first_name, last_name, department, avatar_url), branches(id, name)"
          )
          .is("deleted_at", null)
          .or(`branch_id.eq.${targetBranch},branch_id.is.null`)
          .order("created_at", { ascending: false }),
        supabase
          .from("it_tickets")
          .select("id, title, requester_name, priority, status, category, description, branch_id, created_at, resolved_at, branches(id, name)")
          .is("deleted_at", null)
          .or(`branch_id.eq.${targetBranch},branch_id.is.null`)
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id")
          .eq("status", "active")
          .eq("branch_id", targetBranch)
          .is("deleted_at", null)
          .order("first_name"),
      ]);

      const formattedAssets = (a || []).map((x: any) => ({
        ...x,
        employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null,
        branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
      })) as ITAsset[];

      const formattedTickets = (t || []).map((x: any) => ({
        ...x,
        branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
      })) as ITTicket[];

      setAssets(formattedAssets);
      setTickets(formattedTickets);
      setEmployees((e as Employee[]) || []);
    } catch (err) {
      console.error("Failed to load IT data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("it-management-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "it_assets" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "it_tickets" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  return {
    isSuperAdmin,
    isBranchAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    assets,
    setAssets,
    tickets,
    setTickets,
    employees,
    branches,
    loading,
    loadData,
  };
}
